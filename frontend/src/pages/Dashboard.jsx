import { BookMarked, BrainCircuit, Compass, History, LayoutDashboard, Rocket, Search, Sparkles } from 'lucide-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import StatCard from '../components/dashboard/StatCard'
import RecentSearches from '../components/dashboard/RecentSearches'
import CourseCard from '../components/search/CourseCard'
import { base44 } from '../lib/mockBase44'

function Dashboard() {
  const navigate = useNavigate()

  const [searchHistoryQuery, savedCoursesQuery, recentCoursesQuery] = useQueries({
    queries: [
      {
        queryKey: ['searchHistory'],
        queryFn: () => base44.entities.SearchHistory.list({ limit: 20 }),
      },
      {
        queryKey: ['savedCourses'],
        queryFn: () => base44.entities.SavedCourse.list(),
      },
      {
        queryKey: ['recentCourses'],
        queryFn: () => base44.entities.Course.list({ limit: 6 }),
      },
    ],
  })

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  })

  const searchHistory = searchHistoryQuery.data ?? []
  const savedCourses = savedCoursesQuery.data ?? []
  const recentCourses = recentCoursesQuery.data ?? []
  const user = meQuery.data

  const totalSearches = searchHistory.length
  const totalSaved = savedCourses.length
  const inProgressCount = savedCourses.filter((course) => course.status === 'in_progress').length
  const completedCount = savedCourses.filter((course) => course.status === 'completed').length

  const isLoading =
    searchHistoryQuery.isLoading ||
    savedCoursesQuery.isLoading ||
    recentCoursesQuery.isLoading ||
    meQuery.isLoading

  const quickActions = [
    {
      title: 'Run a new search',
      description: 'Use the AI-powered ranking flow to find courses tailored to your interests and constraints.',
      to: '/',
      icon: Search,
      buttonLabel: 'Open search',
      variant: 'default',
    },
    {
      title: 'Refresh recommendations',
      description: 'Explore personalized suggestions generated from your search history, saves, and preferences.',
      to: '/recommendations',
      icon: BrainCircuit,
      buttonLabel: 'View recommendations',
      variant: 'outline',
    },
  ]

  const handleSearchAgain = (query) => {
    navigate('/', { state: { searchQuery: query, runSearch: true } })
  }

  return (
    <section className="section-shell space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LayoutDashboard className="size-3.5" />
              Learning command center
            </div>

            <h1 className="max-w-3xl text-3xl font-semibold text-balance sm:text-4xl">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
              Your course discovery activity is looking strong.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Track your momentum across searches, bookmarked courses, and recent discoveries.
              This dashboard mirrors the original product structure while using your custom
              pipeline-driven frontend data layer.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/">
                  <Search className="mr-2 size-4" />
                  Search courses
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link to="/saved">
                  <BookMarked className="mr-2 size-4" />
                  View saved courses
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-white/50 bg-white/80 shadow-card backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-primary" />
              Snapshot
            </CardTitle>
            <CardDescription>
              A quick look at your learning pipeline and activity trends.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Compass className="size-3.5 text-accent" />
                  Searches completed
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{totalSearches}</p>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Rocket className="size-3.5 text-primary" />
                  Current focus
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {savedCourses[0]?.category || 'Start by saving a course to build momentum'}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <History className="size-3.5 text-amber-500" />
                  Latest activity
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {searchHistory[0]?.query || 'No search history yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Search}
          label="Total Searches"
          value={isLoading ? '—' : totalSearches}
          color="primary"
          index={0}
          description="Queries run through the ranked search workflow."
        />
        <StatCard
          icon={BookMarked}
          label="Saved Courses"
          value={isLoading ? '—' : totalSaved}
          color="accent"
          index={1}
          description="Courses you bookmarked to revisit later."
        />
        <StatCard
          icon={Rocket}
          label="In Progress"
          value={isLoading ? '—' : inProgressCount}
          color="chart3"
          index={2}
          description="Courses actively being worked through."
        />
        <StatCard
          icon={BrainCircuit}
          label="Completed"
          value={isLoading ? '—' : completedCount}
          color="chart4"
          index={3}
          description="Courses you marked as completed."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <RecentSearches searches={searchHistory} onSearchAgain={handleSearchAgain} />

        <Card className="border-white/50 bg-white/80 shadow-card backdrop-blur">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription className="mt-1">
                Jump back into the most important parts of the app.
              </CardDescription>
            </div>

            <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              2 shortcuts
            </div>
          </CardHeader>

          <CardContent className="grid gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <div
                  key={action.title}
                  className="rounded-3xl border bg-background/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{action.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {action.description}
                      </p>

                      <Button asChild variant={action.variant} className="mt-4">
                        <Link to={action.to}>{action.buttonLabel}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/50 bg-white/80 shadow-card backdrop-blur">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Recently Discovered Courses</CardTitle>
            <CardDescription className="mt-1">
              The latest cached courses surfaced by your search and recommendation flows.
            </CardDescription>
          </div>

          <Button asChild variant="outline">
            <Link to="/">
              <Search className="mr-2 size-4" />
              Find more courses
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {recentCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-muted/30 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No discovered courses yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Run a search to populate the recent course cache and surface results here.
              </p>
              <Button asChild className="mt-5">
                <Link to="/">Start searching</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {recentCourses.map((course, index) => (
                <CourseCard
                  key={course.id ?? `${course.platform}-${course.course_title}`}
                  course={course}
                  index={index}
                  compact
                  actionLabel="Recently discovered"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default Dashboard
