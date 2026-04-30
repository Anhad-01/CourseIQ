import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookMarked, ExternalLink, LoaderCircle, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import CourseCard from '../components/search/CourseCard'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { SavedCourse } from '../lib/apiClient'
import { formatDate, titleCase } from '../lib/utils'
import { toast } from 'sonner'

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Bookmarked', value: 'bookmarked' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BookMarked className="size-6" />
      </div>
      <h2 className="text-2xl font-semibold">No saved courses yet</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        Bookmark courses from the search or recommendations pages to track them here,
        update their progress, and revisit them anytime.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
        <LoaderCircle className="size-4 animate-spin" />
        Loading your saved courses...
      </div>
    </div>
  )
}

function SavedCourseRow({ course, onStatusChange, onDelete, isUpdating, isDeleting }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-card"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <CourseCard
            course={course}
            compact
            actionLabel={`Saved ${formatDate(course.saved_at || course.updated_at)}`}
          />
        </div>

        <Card className="h-fit border-border/70 bg-background/80 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Manage course</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update progress, open the provider page, or remove this course from your list.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor={`status-${course.id}`}
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Learning status
              </label>
              <Select
                id={`status-${course.id}`}
                value={course.status || 'bookmarked'}
                onChange={(event) => onStatusChange(course.id, event.target.value)}
                disabled={isUpdating || isDeleting}
              >
                <SelectItem value="bookmarked">Bookmarked</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </Select>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Current status
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {titleCase(course.status || 'bookmarked')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last updated {formatDate(course.updated_at || course.saved_at)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" disabled={isUpdating || isDeleting}>
                <a href={course.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Open course
                </a>
              </Button>

              <Button
                variant="destructive"
                onClick={() => onDelete(course.id)}
                disabled={isUpdating || isDeleting}
              >
                {isDeleting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function SavedCoursesSection({
  items,
  updateMutation,
  deleteMutation,
}) {
  if (!items.length) {
    return <EmptyState />
  }

  return (
    <div className="space-y-5">
      {items.map((course) => (
        <SavedCourseRow
          key={course.id}
          course={course}
          onStatusChange={(id, status) =>
            updateMutation.mutate({ id, patch: { status } })
          }
          onDelete={(id) => deleteMutation.mutate(id)}
          isUpdating={updateMutation.isPending && updateMutation.variables?.id === course.id}
          isDeleting={deleteMutation.isPending && deleteMutation.variables === course.id}
        />
      ))}
    </div>
  )
}

export default function SavedCourses() {
  const queryClient = useQueryClient()

  const { data: savedCourses = [], isLoading } = useQuery({
    queryKey: ['savedCourses'],
    queryFn: () => SavedCourse.list(),
  })

  const counts = useMemo(() => {
    return {
      all: savedCourses.length,
      bookmarked: savedCourses.filter((course) => course.status === 'bookmarked').length,
      in_progress: savedCourses.filter((course) => course.status === 'in_progress').length,
      completed: savedCourses.filter((course) => course.status === 'completed').length,
    }
  }, [savedCourses])

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => SavedCourse.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['savedCourses'] })

      const previous = queryClient.getQueryData(['savedCourses']) || []

      queryClient.setQueryData(['savedCourses'], (current = []) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['savedCourses'], context.previous)
      }
      toast.error('Could not update course status')
    },
    onSuccess: (_data, variables) => {
      const nextStatus = variables.patch?.status
      toast.success(`Marked as ${titleCase(nextStatus || 'updated')}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => SavedCourse.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['savedCourses'] })

      const previous = queryClient.getQueryData(['savedCourses']) || []

      queryClient.setQueryData(['savedCourses'], (current = []) =>
        current.filter((item) => item.id !== id),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['savedCourses'], context.previous)
      }
      toast.error('Could not remove course')
    },
    onSuccess: () => {
      toast.success('Removed from saved')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] })
    },
  })

  if (isLoading) {
    return (
      <section className="section-shell">
        <LoadingState />
      </section>
    )
  }

  return (
    <section className="section-shell space-y-8">
      <div className="glass-panel overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
              Saved Courses
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-balance">
              Track bookmarks, progress, and completions
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage every course you&apos;ve saved in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total saved
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{counts.all}</p>
            </div>
            <div className="rounded-2xl border bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                In progress
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {counts.in_progress}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Completed
              </p>
              <p className="mt-2 text-2xl font-semibold text-accent">
                {counts.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <span>{tab.label}</span>
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {counts[tab.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <SavedCoursesSection
            items={savedCourses}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>

        <TabsContent value="bookmarked">
          <SavedCoursesSection
            items={savedCourses.filter((course) => course.status === 'bookmarked')}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>

        <TabsContent value="in_progress">
          <SavedCoursesSection
            items={savedCourses.filter((course) => course.status === 'in_progress')}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>

        <TabsContent value="completed">
          <SavedCoursesSection
            items={savedCourses.filter((course) => course.status === 'completed')}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}
