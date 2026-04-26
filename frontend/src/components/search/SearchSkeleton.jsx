import { motion } from 'framer-motion'
import { Skeleton } from '../ui/skeleton'

function SearchSkeleton({ count = 6, compact = false }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: index * 0.05 }}
          className="glass-panel overflow-hidden p-5"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  {!compact && <Skeleton className="h-6 w-28 rounded-full" />}
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-7 w-4/5 rounded-xl" />
                  <Skeleton className="h-4 w-1/3 rounded-xl" />
                </div>
              </div>

              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-xl" />
              <Skeleton className="h-4 w-[92%] rounded-xl" />
              {!compact && <Skeleton className="h-4 w-[78%] rounded-xl" />}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-24 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default SearchSkeleton
