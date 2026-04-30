import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BrainCircuit, Lightbulb, RefreshCcw, Sparkles, Target, Users } from 'lucide-react'
import { toast } from 'sonner'
import CourseCard from '../components/search/CourseCard'
import SearchSkeleton from '../components/search/SearchSkeleton'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { getRecommendations } from '../lib/courseSearchAgent'
import { base44 } from '../lib/apiClient'
import { RECOMMENDATION_META } from '../lib/utils'

const explanationCards = [
  {
    key: 'content-based',
    title: 'Content-Based Matching',
    description:
      'Looks at your recent searches, saved course categories, and interests to surface courses with strong topic overlap.',
    icon: Target,
    accent: 'text-primary',
    surface: 'bg-primary/10',
  },
  {
    key: 'collaborative',
    title: 'Collaborative Signals',
    description:
      'Weights your saved and in-progress patterns to estimate what similar learners would likely engage with next.',
    icon: Users,
    accent: 'text-violet-600',
    surface: 'bg-violet-100',
  },
  {
    key: 'discovery',
    title: 'Discovery Injection',
    description:
      'Adds adjacent high-quality topics so your learning path expands beyond the exact same subjects every time.',
    icon: Lightbulb,
    accent: 'text-amber-600',
    surface: 'bg-amber-100',
  },
]

function EmptyRecommendations({ onGenerate, isLoading }) {
  return (
    <Card className="border-dashed border-border/80 bg-white/70 shadow-card">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BrainCircuit className="size-8" />
        </div>

        <h2 className="text-2xl font-semibold">Generate your personalized recommendations</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground whitespace-nowrap">
          Combining your search history, saved course progress, and preference profile
          to rank the next best courses for you.
        </p>

        <Button className="mt-6" onClick={onGenerate} disabled={isLoading}>
          <Sparkles className="mr-2 size-4" />
          Generate recommendations
        </Button>
      </CardContent>
    </Card>
  )
}

function ExplanationCard({ item, index }) {
  const Icon = item.icon

  return (
    <Card
      className="border-white/50 bg-white/80 shadow-card backdrop-blur"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardHeader>
        <div className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${item.surface}`}>
          <Icon className={`size-5 ${item.accent}`} />
        </div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
        <CardDescription className="leading-6">{item.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function RecommendationHeader({ count, onRefresh, isLoading }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">Recommended for you</h2>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {count} result{count === 1 ? '' : 's'}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Refresh to re-run the recommendation ranker using your latest activity and preferences.
        </p>
      </div>

      <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
        <RefreshCcw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh feed
      </Button>
    </div>
  )
}

function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const { data: searchHistory = [] } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: () => base44.entities.SearchHistory.list({ limit: 20 }),
  })

  const { data: savedCourses = [] } = useQuery({
    queryKey: ['savedCourses'],
    queryFn: () => base44.entities.SavedCourse.list(),
  })

  const { data: preferences = null } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => base44.entities.UserPreference.get(),
  })

  const recommendationMutation = useMutation({
    mutationFn: async () =>
      getRecommendations(searchHistory, savedCourses, preferences || {}),
    onSuccess: (data) => {
      setRecommendations(data)
      setHasGenerated(true)
      toast.success('Recommendations refreshed')
    },
    onError: () => {
      toast.error('Unable to generate recommendations right now')
    },
  })

  const summary = useMemo(() => {
    return recommendations.reduce(
      (acc, course) => {
        const type = course.recommendation_type
        if (type && acc[type] !== undefined) {
          acc[type] += 1
        }
        return acc
      },
      {
        'content-based': 0,
        collaborative: 0,
        discovery: 0,
      },
    )
  }, [recommendations])

  const handleGenerate = () => {
    recommendationMutation.mutate()
  }

  const isLoading = recommendationMutation.isPending

  return (
    <section className="section-shell space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-hero-gradient px-6 py-10 shadow-card sm:px-8 lg:px-10">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative max-w-3xl">
          <Badge className="mb-4 rounded-full px-4 py-1.5">
            Hybrid Recommendation Engine
          </Badge>

          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Personalized course discovery built from your learning signals
          </h1>

          {/* <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            This feed mirrors the CourseIQ frontend architecture while using your pipeline logic:
            content-based retrieval, collaborative weighting, and serendipitous discovery.
          </p> */}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {explanationCards.map((item, index) => (
          <ExplanationCard key={item.key} item={item} index={index} />
        ))}
      </div>

      {hasGenerated ? (
        <RecommendationHeader
          count={recommendations.length}
          onRefresh={handleGenerate}
          isLoading={isLoading}
        />
      ) : null}

      {hasGenerated && recommendations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([key, value]) => {
            if (!value) return null
            const meta = RECOMMENDATION_META[key]

            return (
              <Badge
                key={key}
                className={`rounded-full px-3 py-1.5 ${meta?.accent || ''}`}
              >
                {meta?.label || key}: {value}
              </Badge>
            )
          })}
        </div>
      ) : null}

      {isLoading ? (
        <SearchSkeleton count={6} />
      ) : hasGenerated ? (
        recommendations.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {recommendations.map((course, index) => (
              <CourseCard
                key={`${course.id || course.course_title}-${index}`}
                course={course}
                index={index}
                compact={false}
                actionLabel="Recommended next step for your learning path"
              />
            ))}
          </div>
        ) : (
          <Card className="border-white/50 bg-white/80 shadow-card">
            <CardContent className="px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Sparkles className="size-6" />
              </div>
              <h3 className="text-xl font-semibold">No recommendations available yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Try saving a few courses or running more searches so the recommendation engine has
                stronger signals to work with.
              </p>
              <Button className="mt-6" onClick={handleGenerate}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <EmptyRecommendations onGenerate={handleGenerate} isLoading={isLoading} />
      )}
    </section>
  )
}

export default Recommendations
