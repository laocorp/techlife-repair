import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: 'bg-background-secondary text-foreground-secondary border-border',
        success: 'bg-success-light text-success border-success/20',
        warning: 'bg-warning-light text-warning border-warning/20',
        error: 'bg-error-light text-error border-error/20',
        info: 'bg-info-light text-info border-info/20',
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, type BadgeProps }
