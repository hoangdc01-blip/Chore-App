import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
  secondary:
    'border border-border hover:bg-muted',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
} as const

const sizeStyles = {
  sm: 'rounded-md px-3 py-1.5 text-sm font-medium min-h-[36px]',
  default: 'rounded-md px-4 py-2.5 text-sm font-medium min-h-[44px]',
} as const

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
export default Button
