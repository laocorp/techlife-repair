import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, id, ...props }, ref) => {
        const inputId = id || React.useId()

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        'flex h-9 w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm',
                        'placeholder:text-foreground-muted',
                        'transition-colors duration-150',
                        'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-error focus:border-error focus:ring-error',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-error">{error}</p>
                )}
                {hint && !error && (
                    <p className="mt-1 text-xs text-foreground-muted">{hint}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export { Input }
