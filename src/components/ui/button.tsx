import type { ComponentProps } from 'react'
import { cn } from 'shuutils'

const variantClasses = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
} as const

type ButtonProps = ComponentProps<'button'> & {
  name: string
  variant?: keyof typeof variantClasses
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        variantClasses[variant],
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
