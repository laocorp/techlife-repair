'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Settings, Check, Trash2, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    type Notification
} from '@/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const NOTIFICATION_ICONS: Record<string, string> = {
    order_created: '📦',
    order_status_changed: '🔄',
    payment_received: '💰',
    low_stock: '⚠️',
    default: '🔔'
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isPending, startTransition] = useTransition()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.read).length

    // Fetch notifications on mount and every 10 seconds
    useEffect(() => {
        const fetchNotifications = async () => {
            const data = await getNotifications()
            setNotifications(data)
        }

        fetchNotifications()
        const interval = setInterval(fetchNotifications, 10000) // 10 seconds

        return () => clearInterval(interval)
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        startTransition(async () => {
            await markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            )
        })
    }

    const handleMarkAllAsRead = async () => {
        startTransition(async () => {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        })
    }

    const handleDelete = async (id: string) => {
        startTransition(async () => {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        })
    }

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
        } catch {
            return ''
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-error text-[10px] font-bold flex items-center justify-center text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-border bg-background shadow-xl z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-medium text-sm">Notificaciones</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                    disabled={isPending}
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Marcar todas
                                </button>
                            )}
                            <Link
                                href="/dashboard/settings/notifications"
                                className="text-foreground-muted hover:text-foreground transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-foreground-muted mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-foreground-muted">No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group px-4 py-3 border-b border-border last:border-0 hover:bg-background-secondary transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <span className="text-lg flex-shrink-0">
                                            {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default}
                                        </span>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                                        {notification.title}
                                                    </p>
                                                    {notification.message && (
                                                        <p className="text-xs text-foreground-muted mt-0.5 truncate">
                                                            {notification.message}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-foreground-muted mt-1">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1 rounded hover:bg-background text-foreground-muted hover:text-foreground"
                                                            title="Marcar como leída"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1 rounded hover:bg-background text-foreground-muted hover:text-error"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-border text-center">
                            <Link
                                href="/dashboard/settings/notifications"
                                className="text-xs text-primary hover:underline"
                                onClick={() => setIsOpen(false)}
                            >
                                Configurar notificaciones →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
