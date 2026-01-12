import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-[var(--radius)] bg-background-secondary',
                className
            )}
            {...props}
        />
    )
}

export { Skeleton }
