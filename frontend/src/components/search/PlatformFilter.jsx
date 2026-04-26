import { Badge } from '../ui/badge'
import { cn, PLATFORM_OPTIONS } from '../../lib/utils'

function PlatformFilter({
  selected = 'All',
  onChange,
  platforms = PLATFORM_OPTIONS,
  counts = {},
  className,
}) {
  const options = ['All', ...platforms]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((platform) => {
        const isActive = selected === platform
        const count = platform === 'All' ? null : counts[platform]

        return (
          <button
            key={platform}
            type="button"
            onClick={() => onChange?.(platform)}
            className={cn(
              'rounded-full transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
            aria-pressed={isActive}
          >
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-white text-foreground hover:bg-muted',
              )}
            >
              <span>{platform}</span>
              {typeof count === 'number' && (
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs',
                    isActive
                      ? 'bg-white/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

export default PlatformFilter
