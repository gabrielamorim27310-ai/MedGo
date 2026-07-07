import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

/** Pílula de vidro tingido — cor no texto, translucidez no fundo. */
function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-primary/30 bg-primary/15 text-primary dark:text-[hsl(172_60%_70%)]':
            variant === 'default',
          'border-border/60 bg-white/40 text-secondary-foreground dark:bg-white/10':
            variant === 'secondary',
          'border-destructive/30 bg-destructive/15 text-destructive':
            variant === 'destructive',
          'border-border/70 bg-transparent text-foreground': variant === 'outline',
          'border-success/30 bg-success/15 text-success dark:text-[hsl(152_50%_65%)]':
            variant === 'success',
          'border-brass/30 bg-brass/15 text-[hsl(32_75%_38%)] dark:text-[hsl(40_85%_65%)]':
            variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
