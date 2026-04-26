import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const colorMap = {
  primary: {
    iconWrap: 'bg-primary/12 text-primary',
    value: 'text-primary',
    glow: 'from-primary/20 via-primary/5 to-transparent',
  },
  accent: {
    iconWrap: 'bg-accent/12 text-accent',
    value: 'text-accent',
    glow: 'from-accent/20 via-accent/5 to-transparent',
  },
  chart3: {
    iconWrap: 'bg-chart3/12 text-amber-600',
    value: 'text-amber-600',
    glow: 'from-chart3/20 via-chart3/5 to-transparent',
  },
  chart4: {
    iconWrap: 'bg-chart4/12 text-violet-600',
    value: 'text-violet-600',
    glow: 'from-chart4/20 via-chart4/5 to-transparent',
  },
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'primary',
  index = 0,
  description,
  className,
}) {
  const palette = colorMap[color] || colorMap.primary

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: 'easeOut',
      }}
      className={cn(
        'glass-panel group relative overflow-hidden p-5 sm:p-6',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover:opacity-100',
          palette.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn('text-3xl font-semibold tracking-tight', palette.value)}>
            {value}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/40 shadow-sm',
            palette.iconWrap,
          )}
        >
          {Icon ? <Icon className="size-5" /> : null}
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard
