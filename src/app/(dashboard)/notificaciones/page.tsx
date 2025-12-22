'use client'

import { useState, useMemo } from 'react'
import { useNotificaciones } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Bell,
    CheckCircle2,
    Clock,
    DollarSign,
    Package,
    Settings,
    Loader2,
    Filter,
    CheckCheck,
    Inbox
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

type FilterType = 'todas' | 'no_leidas' | 'orden' | 'pago' | 'sistema' | 'completada'

const tipoConfig = {
    orden: {
        icon: Package,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        label: 'Orden'
    },
    pago: {
        icon: DollarSign,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        label: 'Pago'
    },
    completada: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        label: 'Completada'
    },
    sistema: {
        icon: Settings,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        label: 'Sistema'
    }
}

export default function NotificacionesPage() {
    const { notificaciones, unreadCount, isLoading, marcarLeida, marcarTodasLeidas
    } = useNotificaciones()
    const [filter, setFilter] = useState<FilterType>('todas')

    const filteredNotificaciones = useMemo(() => {
        if (filter === 'todas') return notificaciones
        if (filter === 'no_leidas') return notificaciones.filter(n => !n.leida)
        return notificaciones.filter(n => n.tipo === filter)
    }, [notificaciones, filter])

    const formatTime = (date: string) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
    }

    const handleNotificationClick = async (notif: typeof notificaciones[0]) => {
        if (!notif.leida) {
            await marcarLeida(notif.id)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[hsl(var(--text-primary))]">
                        Notificaciones
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                        {unreadCount > 0
                            ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                            : 'Todas las notificaciones están leídas'
                        }
                    </p>
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={marcarTodasLeidas}
                        className="gap-2"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Marcar todas como leídas
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                        <CardTitle className="text-base">Filtros</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
                            <TabsTrigger
                                value="todas"
                                className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white"
                            >
                                Todas
                                <Badge variant="secondary" className="ml-2">
                                    {notificaciones.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="no_leidas"
                                className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white"
                            >
                                Sin leer
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="orden"
                                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                            >
                                <Package className="h-4 w-4 mr-1" />
                                Órdenes
                            </TabsTrigger>
                            <TabsTrigger
                                value="pago"
                                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                            >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagos
                            </TabsTrigger>
                            <TabsTrigger
                                value="completada"
                                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Completadas
                            </TabsTrigger>
                            <TabsTrigger
                                value="sistema"
                                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                            >
                                <Settings className="h-4 w-4 mr-1" />
                                Sistema
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {filter === 'todas' ? 'Todas las notificaciones' :
                            filter === 'no_leidas' ? 'Notificaciones sin leer' :
                                `Notificaciones de ${tipoConfig[filter as keyof typeof tipoConfig]?.label || filter}`}
                    </CardTitle>
                    <CardDescription>
                        Mostrando {filteredNotificaciones.length} notificación{filteredNotificaciones.length !== 1 ? 'es' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredNotificaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Inbox className="h-12 w-12 text-[hsl(var(--text-muted))] mb-4" />
                            <p className="text-[hsl(var(--text-muted))]">
                                No hay notificaciones {filter !== 'todas' ? 'con este filtro' : ''}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-2">
                                {filteredNotificaciones.map((notif) => {
                                    const config = tipoConfig[notif.tipo] || tipoConfig.sistema
                                    const Icon = config.icon

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`
                                                relative flex gap-4 p-4 rounded-lg border cursor-pointer
                                                transition-all duration-200 hover:shadow-sm
                                                ${!notif.leida
                                                    ? 'bg-[hsl(var(--accent-subtle))] border-[hsl(var(--primary))/20]'
                                                    : 'bg-white border-[hsl(var(--border-default))] hover:bg-[hsl(var(--bg-subtle))]'
                                                }
                                            `}
                                        >
                                            {/* Unread indicator */}
                                            {!notif.leida && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                                            )}

                                            {/* Icon */}
                                            <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}>
                                                <Icon className={`h-5 w-5 ${config.color}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-medium text-sm ${!notif.leida ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-secondary))]'}`}>
                                                        {notif.titulo}
                                                    </p>
                                                    <Badge variant="outline" className={`flex-shrink-0 ${config.color}`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1 line-clamp-2">
                                                    {notif.mensaje}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(notif.created_at)}
                                                    </span>
                                                    {notif.link && (
                                                        <Link
                                                            href={notif.link}
                                                            className="text-xs text-[hsl(var(--primary))] hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Ver detalles →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
