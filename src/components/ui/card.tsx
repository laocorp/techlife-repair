import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-[var(--radius-lg)] border border-border bg-background-tertiary shadow-card',
                className
            )}
            {...props}
        />
    )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardHeader({ className, ...props }: CardHeaderProps) {
    return (
        <div
            className={cn('flex flex-col space-y-1.5 p-5', className)}
            {...props}
        />
    )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

function CardTitle({ className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn('text-base font-semibold text-foreground', className)}
            {...props}
        />
    )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

function CardDescription({ className, ...props }: CardDescriptionProps) {
    return (
        <p
            className={cn('text-sm text-foreground-secondary', className)}
            {...props}
        />
    )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardContent({ className, ...props }: CardContentProps) {
    return <div className={cn('p-5 pt-0', className)} {...props} />
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardFooter({ className, ...props }: CardFooterProps) {
    return (
        <div
            className={cn('flex items-center p-5 pt-0', className)}
            {...props}
        />
    )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
