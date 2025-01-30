import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        // Ensure the value is not negative
        const value = Math.max(Number(e.target.value), 0) // Clamp to 0 or higher
        e.target.value = value.toString()
      }

      // Call the original onChange handler if provided
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-[2.8rem] w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        onChange={handleChange}
        min={type === 'number' ? 0 : undefined} // Set min attribute for number type
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }