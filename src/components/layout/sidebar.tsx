'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV, SETTINGS_NAV, type NavItem } from '@/lib/constants/navigation'
import {
    ChevronDown,
    ChevronRight,
    LogOut,
    Settings,
    Menu,
    X,
} from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import { useState } from 'react'

interface SidebarProps {
    user: {
        full_name: string
        email: string
        avatar_url?: string | null
        role: string
    }
    tenant: {
        name: string
    }
    availableModules?: string[]
}

export function Sidebar({ user, tenant, availableModules }: SidebarProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])

    const toggleExpanded = (href: string) => {
        setExpandedItems(prev =>
            prev.includes(href)
                ? prev.filter(item => item !== href)
                : [...prev, href]
        )
    }

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

    const isModuleAllowed = (permission?: string) => {
        if (!permission) return true
        if (!availableModules) return true

        // Extract module name from permission (e.g., 'inventory:read' -> 'inventory')
        const [module] = permission.split(':')

        // List of modules that can be restricted by plan
        const RESTRICTED_MODULES = ['clients', 'work_orders', 'reports', 'inventory', 'invoices', 'accounting']

        // If it's not a restricted module type, allow it (e.g., 'users', 'settings')
        if (!RESTRICTED_MODULES.includes(module)) return true

        return availableModules.includes(module)
    }

    const renderNavItem = (item: NavItem, depth = 0) => {
        // Check if module is allowed
        if (!isModuleAllowed(item.permission)) return null

        // Check children
        const children = item.children?.filter(child => isModuleAllowed(child.permission))
        const hasChildren = children && children.length > 0

        // If it has children but none are allowed, and it's not a direct link itself (or it is?), 
        // usually section headers with empty children should be hidden if they depend on children.
        // But here items have hrefs too.

        const isExpanded = expandedItems.includes(item.href)
        const active = isActive(item.href)

        return (
            <div key={item.href}>
                <Link
                    href={hasChildren ? '#' : item.href}
                    onClick={(e) => {
                        if (hasChildren) {
                            e.preventDefault()
                            toggleExpanded(item.href)
                        } else {
                            setMobileOpen(false)
                        }
                    }}
                    className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                            ? 'bg-primary-light text-primary'
                            : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground',
                        depth > 0 && 'pl-9'
                    )}
                >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.title}</span>
                    {hasChildren && (
                        isExpanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                    )}
                </Link>

                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {children.map(child => renderNavItem(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">TR</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{tenant.name}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                    {DASHBOARD_NAV.map(item => renderNavItem(item))}
                </div>

                <div className="mt-6">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        Configuración
                    </p>
                    <div className="space-y-1">
                        {SETTINGS_NAV.map(item => renderNavItem(item))}
                    </div>
                </div>
            </nav>

            {/* User section */}
            <div className="border-t border-border p-3">
                <div className="flex items-center gap-3 rounded-md px-3 py-2">
                    <Avatar
                        src={user.avatar_url}
                        fallback={user.full_name}
                        size="sm"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user.full_name}
                        </p>
                        <p className="text-xs text-foreground-muted truncate">
                            {user.email}
                        </p>
                    </div>
                    <form action="/api/auth/signout" method="POST">
                        <button
                            type="submit"
                            className="p-1.5 rounded-md text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-3 left-3 z-50 p-2 rounded-md bg-background border border-border lg:hidden"
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform lg:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
