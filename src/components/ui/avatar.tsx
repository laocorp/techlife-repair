import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null
    fallback: string
    size?: 'xs' | 'sm' | 'md' | 'lg'
}

function Avatar({ src, fallback, size = 'md', className, ...props }: AvatarProps) {
    const [imageError, setImageError] = React.useState(false)

    const sizes = {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    }

    const showFallback = !src || imageError

    return (
        <div
            className={cn(
                'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
                'bg-background-secondary text-foreground-secondary font-medium',
                sizes[size],
                className
            )}
            {...props}
        >
            {showFallback ? (
                <span>{fallback.charAt(0).toUpperCase()}</span>
            ) : (
                <img
                    src={src}
                    alt={fallback}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                />
            )}
        </div>
    )
}

export { Avatar, type AvatarProps }
