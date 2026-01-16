'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Bell, Search, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui'

export function Header() {
    const pathname = usePathname()
    const [showNotifications, setShowNotifications] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Generate breadcrumbs from pathname
    const segments = pathname.split('/').filter(Boolean).slice(1) // Remove 'dashboard'

    const breadcrumbs = segments.map((segment, index) => {
        const href = '/dashboard/' + segments.slice(0, index + 1).join('/')
        const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase())

        return { href, label }
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Sample notifications - in production these would come from the database
    const notifications = [
        { id: 1, title: 'Nueva orden recibida', time: 'Hace 5 min', read: false },
        { id: 2, title: 'Stock bajo: Pantalla iPhone 13', time: 'Hace 1 hora', read: false },
        { id: 3, title: 'Pago registrado - $150.00', time: 'Hace 2 horas', read: true },
    ]

    const unreadCount = notifications.filter(n => !n.read).length

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
            <div className="relative" ref={dropdownRef}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
                    )}
                </Button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-background shadow-xl z-50">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="font-medium text-sm">Notificaciones</h3>
                            <Link
                                href="/dashboard/settings/notifications"
                                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                                onClick={() => setShowNotifications(false)}
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-foreground-muted">
                                    No hay notificaciones
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-border last:border-0 hover:bg-background-secondary transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!notification.read && (
                                                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            )}
                                            <div className={!notification.read ? '' : 'pl-5'}>
                                                <p className="text-sm">{notification.title}</p>
                                                <p className="text-xs text-foreground-muted mt-0.5">{notification.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-border">
                            <Link
                                href="/dashboard/settings/notifications"
                                className="text-xs text-primary hover:underline"
                                onClick={() => setShowNotifications(false)}
                            >
                                Configurar notificaciones →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

