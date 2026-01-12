'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Bell, Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'

export function Header() {
    const pathname = usePathname()

    // Generate breadcrumbs from pathname
    const segments = pathname.split('/').filter(Boolean).slice(1) // Remove 'dashboard'

    const breadcrumbs = segments.map((segment, index) => {
        const href = '/dashboard/' + segments.slice(0, index + 1).join('/')
        const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase())

        return { href, label }
    })

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm">
                <Link
                    href="/dashboard"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                >
                    Dashboard
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 text-foreground-muted" />
                        {index === breadcrumbs.length - 1 ? (
                            <span className="text-foreground font-medium">{crumb.label}</span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-foreground-muted hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:block relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background-secondary text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
            </Button>
        </header>
    )
}
