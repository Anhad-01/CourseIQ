import * as React from 'react'
import { cn } from '../../lib/utils'

const TabsContext = React.createContext(null)

function Tabs({ value, defaultValue, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const setValue = React.useCallback(
    (nextValue) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange],
  )

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      setValue,
    }),
    [currentValue, setValue],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children, ...props }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-auto w-full flex-wrap gap-2 rounded-2xl border border-border bg-muted/70 p-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children, ...props }) {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs')
  }

  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => context.setValue(value)}
      className={cn(
        'ring-focus inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all',
        isActive
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children, ...props }) {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error('TabsContent must be used within Tabs')
  }

  if (context.value !== value) {
    return null
  }

  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn('mt-6 outline-none', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
