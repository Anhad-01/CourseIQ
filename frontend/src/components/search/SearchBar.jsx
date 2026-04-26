import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, Search, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

const sizeStyles = {
  large: {
    wrapper: 'rounded-3xl border border-white/60 bg-white/90 p-3 shadow-card backdrop-blur',
    form: 'flex flex-col gap-3 md:flex-row md:items-center',
    iconBox: 'flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary',
    input:
      'h-14 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-lg',
    button: 'h-12 rounded-2xl px-6 text-sm font-semibold',
    helper: 'px-1 text-xs text-muted-foreground',
  },
  small: {
    wrapper: 'rounded-2xl border border-border/70 bg-white/90 p-2.5 shadow-sm backdrop-blur',
    form: 'flex flex-col gap-2 sm:flex-row sm:items-center',
    iconBox: 'flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary',
    input:
      'h-11 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base',
    button: 'h-11 rounded-xl px-5 text-sm font-medium',
    helper: 'px-1 text-[11px] text-muted-foreground',
  },
}

function SearchBar({
  value = '',
  onChange,
  onSearch,
  isLoading = false,
  size = 'large',
  placeholder = 'Search for AI, frontend, data science, or platform-specific courses...',
  autoFocus = false,
  className,
}) {
  const [query, setQuery] = useState(value)
  const styles = sizeStyles[size] ?? sizeStyles.large

  useEffect(() => {
    setQuery(value)
  }, [value])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmed = query.trim()
    if (!trimmed || isLoading) {
      return
    }

    onSearch?.(trimmed)
  }

  const handleChange = (event) => {
    const nextValue = event.target.value
    setQuery(nextValue)
    onChange?.(nextValue)
  }

  return (
    <motion.div
      whileFocusWithin={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn('w-full', className)}
    >
      <div className={cn('glass-panel', styles.wrapper)}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.iconBox}>
            {isLoading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Input
              value={query}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={isLoading}
              autoFocus={autoFocus}
              className={styles.input}
            />
            <p className={styles.helper}>
              Powered by CourseIQ&apos;s pipeline-aware ranking and recommendation logic.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={cn('shrink-0 gap-2', styles.button)}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Find courses
              </>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}

export default SearchBar
