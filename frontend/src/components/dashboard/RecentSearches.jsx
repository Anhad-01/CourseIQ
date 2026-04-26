import { Clock3, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { formatDate } from '../../lib/utils'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Search className="size-5" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">No recent searches yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start with a course query to build your search history and quickly revisit topics later.
      </p>
      <Button asChild className="mt-5">
        <Link to="/">Go to search</Link>
      </Button>
    </div>
  )
}

function RecentSearchItem({ item, index, onSearchAgain }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      onClick={() => onSearchAgain?.(item.query)}
      className="group flex w-full items-center justify-between rounded-2xl border border-transparent bg-background px-4 py-3 text-left transition hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1 pr-4">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {item.query}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" />
          <span>{formatDate(item.created_at)}</span>
        </div>
      </div>

      <div className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
        Search again
      </div>
    </motion.button>
  )
}

function RecentSearches({ searches = [], onSearchAgain }) {
  const items = searches.slice(0, 8)

  return (
    <Card className="border-white/50 bg-white/80 shadow-card backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">Recent Searches</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Re-run a previous query with one click.
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {items.length} item{items.length === 1 ? '' : 's'}
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <RecentSearchItem
                key={item.id ?? `${item.query}-${index}`}
                item={item}
                index={index}
                onSearchAgain={onSearchAgain}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentSearches
