import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  BrainCircuit,
  Compass,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import SearchBar from '../components/search/SearchBar'
import PlatformFilter from '../components/search/PlatformFilter'
import CourseCard from '../components/search/CourseCard'
import SearchSkeleton from '../components/search/SearchSkeleton'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { base44 } from '../lib/apiClient'
import { searchCoursesWithAI } from '../lib/courseSearchAgent'
import { PLATFORM_OPTIONS, TRENDING_TOPICS } from '../lib/utils'

function SearchPage() {
  const queryClient = useQueryClient()
  const [results, setResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [platformFilter, setPlatformFilter] = useState('All')

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => base44.entities.UserPreference.get(),
  })

  const { data: savedCourses = [] } = useQuery({
    queryKey: ['savedCourses'],
    queryFn: () => base44.entities.SavedCourse.list(),
  })

  const searchMutation = useMutation({
    mutationFn: async (query) => {
      const normalizedResults = await searchCoursesWithAI(query, preferences || {})

      return normalizedResults
    },
    onSuccess: (data, query) => {
      setResults(data)
      setHasSearched(true)
      setPlatformFilter('All')
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] })
      queryClient.invalidateQueries({ queryKey: ['recentCourses'] })
      toast.success(`Found ${data.length} course${data.length === 1 ? '' : 's'} for "${query}"`)
    },
    onError: () => {
      toast.error('Unable to search courses right now')
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (course) => {
      const existing = savedCourses.find(
        (item) =>
          item.source_course_id === course.id ||
          (item.course_title === course.course_title && item.platform === course.platform),
      )

      if (existing) {
        await base44.entities.SavedCourse.delete(existing.id)
        return { action: 'removed', course }
      }

      await base44.entities.SavedCourse.createFromCourse(course)
      return { action: 'saved', course }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] })
      toast.success(action === 'saved' ? 'Course saved!' : 'Removed from saved')
    },
    onError: () => {
      toast.error('Could not update saved courses')
    },
  })

  const filteredResults = useMemo(() => {
    if (platformFilter === 'All') {
      return results
    }

    return results.filter((course) => course.platform === platformFilter)
  }, [platformFilter, results])

  const resultCounts = useMemo(() => {
    return results.reduce((acc, course) => {
      acc[course.platform] = (acc[course.platform] || 0) + 1
      return acc
    }, {})
  }, [results])

  const savedLookup = useMemo(() => {
    return new Set(
      savedCourses.map((item) => item.source_course_id || `${item.platform}-${item.course_title}`),
    )
  }, [savedCourses])

  const activePlatforms = useMemo(() => {
    const seen = new Set(results.map((course) => course.platform))
    return PLATFORM_OPTIONS.filter((platform) => seen.has(platform))
  }, [results])

  const platformStats = [
    {
      label: 'Platforms covered',
      value: activePlatforms.length || preferences?.preferred_platforms?.length || 7,
      icon: Compass,
      accent: 'text-primary',
    },
    {
      label: 'Pipeline ranking',
      value: 'Semantic + constraints',
      icon: BrainCircuit,
      accent: 'text-accent',
    },
    {
      label: 'Results cached',
      value: results.length ? `${results.length} courses` : 'Ready',
      icon: BarChart3,
      accent: 'text-amber-600',
    },
  ]

  const handleSearch = (query) => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }

    setSearchQuery(trimmed)
    searchMutation.mutate(trimmed)
  }

  const handleTopicClick = (topic) => {
    setSearchQuery(topic)
    handleSearch(topic)
  }

  return (
    <section className="section-shell space-y-8">
      {!hasSearched ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 px-6 py-10 shadow-card backdrop-blur sm:px-10 sm:py-14">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />

          <div className="relative mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-4 py-1.5 text-primary">
                <Sparkles className="mr-2 size-3.5" />
                CourseIQ frontend replica
              </Badge>

              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Discover the right courses with a
                <span className="gradient-text"> smarter search experience</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
                Search across leading learning platforms
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-4xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                isLoading={searchMutation.isPending}
                size="large"
                autoFocus
              />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {TRENDING_TOPICS.map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  className="rounded-full bg-white/80"
                  onClick={() => handleTopicClick(topic)}
                >
                  <TrendingUp className="size-4" />
                  {topic}
                </Button>
              ))}
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {platformStats.map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-border/70 bg-background/70 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {item.value}
                        </p>
                      </div>

                      <div
                        className={`flex size-11 items-center justify-center rounded-2xl bg-muted ${item.accent}`}
                      >
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-border/70 bg-muted/40 p-5">
              <p className="text-sm font-medium text-foreground">Active preference snapshot</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(preferences?.preferred_platforms || []).map((platform) => (
                  <Badge key={platform} variant="secondary">
                    {platform}
                  </Badge>
                ))}
                {preferences?.skill_level ? (
                  <Badge variant="outline">{preferences.skill_level}</Badge>
                ) : null}
                {preferences?.budget ? (
                  <Badge variant="outline">{preferences.budget.replace('_', ' ')}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                  AI Search Workspace
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Results for &quot;{searchQuery}&quot;
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Courses ranked using semantic relevance, rating normalization,
                  budget sensitivity, and skill-level fit.
                </p>
              </div>

              <div className="rounded-2xl border bg-background/80 px-4 py-3 text-sm">
                <span className="font-semibold text-foreground">{results.length}</span>{' '}
                total matches
              </div>
            </div>

            <div className="mt-5">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                isLoading={searchMutation.isPending}
                size="small"
              />
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Filter by platform</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Narrow the ranked results to the platforms you want to explore first.
                </p>
              </div>

              <PlatformFilter
                selected={platformFilter}
                onChange={setPlatformFilter}
                platforms={activePlatforms}
                counts={resultCounts}
              />
            </div>
          </div>

          {searchMutation.isPending ? (
            <SearchSkeleton count={6} />
          ) : filteredResults.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <h2 className="text-2xl font-semibold">No courses match this filter</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Try a different platform filter or search again with a broader topic like
                machine learning, frontend, python, or cloud fundamentals.
              </p>
              <div className="mt-6">
                <Button variant="outline" onClick={() => setPlatformFilter('All')}>
                  Reset filter
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredResults.map((course, index) => {
                const savedKey = course.id || `${course.platform}-${course.course_title}`
                const isSaved = savedLookup.has(savedKey)

                return (
                  <CourseCard
                    key={`${course.platform}-${course.course_title}-${index}`}
                    course={course}
                    index={index}
                    isSaved={isSaved}
                    isSaving={saveMutation.isPending}
                    onSave={(selectedCourse) => saveMutation.mutate(selectedCourse)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default SearchPage
