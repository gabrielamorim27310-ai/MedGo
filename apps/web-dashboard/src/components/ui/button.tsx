import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'brass'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            // Vidro tingido de verde-acqua
            'tint-teal text-primary-foreground hover:brightness-110 hover:shadow-glow-teal':
              variant === 'default',
            // Vidro tingido de vermelho
            'tint-red text-destructive-foreground hover:brightness-110':
              variant === 'destructive',
            // Vidro tingido de âmbar
            'tint-amber text-brass-foreground hover:brightness-105 hover:shadow-glow-amber':
              variant === 'brass',
            // Vidro neutro com borda clara
            'glass text-foreground hover:bg-white/60 dark:hover:bg-white/10':
              variant === 'outline' || variant === 'secondary',
            // Transparente até o hover
            'text-foreground hover:glass-subtle hover:bg-white/30 dark:hover:bg-white/5':
              variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-lg px-3': size === 'sm',
            'h-11 rounded-xl px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
