import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Clock3,
  Lightbulb,
  Star,
  Target,
  Users,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import {
  formatPrice,
  PLATFORM_STYLES,
  RECOMMENDATION_META,
  titleCase,
} from '../../lib/utils'

const recommendationIcons = {
  'content-based': Target,
  collaborative: Users,
  discovery: Lightbulb,
}

function CourseCard({
  course,
  index = 0,
  isSaved = false,
  isSaving = false,
  onSave,
  actionLabel,
  compact = false,
}) {
  const platformClass =
    PLATFORM_STYLES[course.platform] || 'border-slate-200 bg-slate-100 text-slate-700'

  const recommendationMeta = course.recommendation_type
    ? RECOMMENDATION_META[course.recommendation_type]
    : null

  const RecommendationIcon = course.recommendation_type
    ? recommendationIcons[course.recommendation_type] || Lightbulb
    : null

  const handleSave = () => {
    if (onSave) {
      onSave(course)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-border/70 bg-card/90 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
        <CardHeader className={compact ? 'space-y-4 p-5' : 'space-y-4 p-6'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={platformClass}>{course.platform}</Badge>

              {course.skill_level ? (
                <Badge variant="secondary">{course.skill_level}</Badge>
              ) : null}

              {course.category ? (
                <Badge variant="outline">{course.category}</Badge>
              ) : null}
            </div>

            {onSave ? (
              <Button
                type="button"
                variant={isSaved ? 'secondary' : 'ghost'}
                size="icon"
                className="shrink-0"
                onClick={handleSave}
                disabled={isSaving}
                aria-label={isSaved ? 'Remove from saved courses' : 'Save course'}
              >
                {isSaved ? (
                  <BookmarkCheck className="size-4" />
                ) : (
                  <Bookmark className="size-4" />
                )}
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className={compact ? 'text-lg font-semibold' : 'text-xl font-semibold'}>
              {course.course_title}
            </h3>

            <p className="text-sm text-muted-foreground">
              {course.instructor ? `By ${course.instructor}` : 'Instructor not listed'}
            </p>
          </div>

          {course.description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className={compact ? 'space-y-4 px-5 pb-5' : 'space-y-5 px-6 pb-6'}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Star className="size-3.5 text-amber-500" />
                Rating
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {course.rating ? `${course.rating}/5` : 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock3 className="size-3.5 text-primary" />
                Duration
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {course.duration || 'Flexible'}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Bookmark className="size-3.5 text-accent" />
                Price
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatPrice(course.price)}
              </p>
            </div>
          </div>

          {recommendationMeta && RecommendationIcon ? (
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <RecommendationIcon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <Badge className={recommendationMeta.accent}>
                    {recommendationMeta.label}
                  </Badge>

                  {course.recommendation_reason ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {course.recommendation_reason}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {(course.ranking_score || course.similarity_score) && !compact ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {course.ranking_score ? (
                <span className="rounded-full bg-muted px-3 py-1">
                  Rank score: {course.ranking_score}
                </span>
              ) : null}

              {course.similarity_score ? (
                <span className="rounded-full bg-muted px-3 py-1">
                  Similarity: {course.similarity_score}
                </span>
              ) : null}

              {course.status ? (
                <span className="rounded-full bg-muted px-3 py-1">
                  Status: {titleCase(course.status)}
                </span>
              ) : null}
            </div>
          ) : null}
        </CardContent>

        <CardFooter
          className={`mt-auto flex items-center justify-between gap-3 border-t bg-muted/20 ${
            compact ? 'p-5' : 'p-6'
          }`}
        >
          <div className="min-w-0">
            {actionLabel ? (
              <p className="truncate text-sm font-medium text-foreground">{actionLabel}</p>
            ) : (
              <p className="truncate text-sm text-muted-foreground">
                Explore this course on {course.platform}
              </p>
            )}
          </div>

          <Button asChild className="shrink-0">
            <a
              href={course.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${course.course_title} in a new tab`}
            >
              Visit
              <ArrowUpRight className="ml-2 size-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default CourseCard
