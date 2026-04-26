import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

const Select = React.forwardRef(
  (
    {
      className,
      children,
      placeholder,
      disabled = false,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const hasValue =
      value !== undefined && value !== null && value !== ''

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'ring-focus flex h-11 w-full appearance-none rounded-2xl border border-input bg-white px-4 pr-11 text-sm text-foreground shadow-sm transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'hover:border-primary/30 focus-visible:border-primary',
            !hasValue && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )
  },
)

Select.displayName = 'Select'

function SelectItem({ className, children, ...props }) {
  return (
    <option className={cn('text-foreground', className)} {...props}>
      {children}
    </option>
  )
}

export { Select, SelectItem }
