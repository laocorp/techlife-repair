// src/app/(dashboard)/kanban/page.tsx
// Kanban board for service orders with drag and drop

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    User,
    Phone,
    RefreshCw,
    GripVertical,
    Eye,
    MoreHorizontal,
    Plus,
    Filter,
    Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Orden {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string | null
    equipo_modelo: string | null
    estado: string
    prioridad: string
    problema_reportado: string | null
    created_at: string
    cliente: {
        nombre: string
        telefono: string | null
    } | null
}

const columnas = [
    {
        id: 'recibido',
        titulo: 'Recibido',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Clock
    },
    {
        id: 'en_diagnostico',
        titulo: 'Diagnóstico',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        icon: AlertTriangle
    },
    {
        id: 'en_reparacion',
        titulo: 'En Reparación',
        color: 'from-violet-500 to-purple-600',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30',
        icon: Wrench
    },
    {
        id: 'terminado',
        titulo: 'Listo',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: CheckCircle
    },
]

const prioridadConfig: Record<string, { color: string; dot: string }> = {
    baja: { color: 'text-slate-400', dot: 'bg-slate-400' },
    normal: { color: 'text-blue-400', dot: 'bg-blue-400' },
    alta: { color: 'text-amber-400', dot: 'bg-amber-400' },
    urgente: { color: 'text-red-400', dot: 'bg-red-400' },
}

export default function KanbanPage() {
    const { user } = useAuthStore()
    const [ordenes, setOrdenes] = useState<Orden[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const loadOrdenes = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const response = await fetch(`/api/ordenes?empresa_id=${user.empresa_id}&exclude_estado=entregado`)

            if (!response.ok) throw new Error('Error al cargar órdenes')

            const data = await response.json()
            setOrdenes(data || [])
        } catch (error: any) {
            console.error('Error loading orders:', error)
            toast.error('Error al cargar órdenes')
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadOrdenes()

        // Polling every 30 seconds
        const interval = setInterval(loadOrdenes, 30000)
        return () => clearInterval(interval)
    }, [loadOrdenes])

    const handleDrop = async (ordenId: string, nuevoEstado: string) => {
        setUpdatingId(ordenId)

        try {
            const response = await fetch(`/api/ordenes/${ordenId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            })

            if (!response.ok) throw new Error('Error al actualizar')

            // Update local state
            setOrdenes(prev => prev.map(o =>
                o.id === ordenId ? { ...o, estado: nuevoEstado } : o
            ))

            toast.success('Estado actualizado')
        } catch (error: any) {
            console.error('Error updating order:', error)
            toast.error('Error al actualizar')
        } finally {
            setUpdatingId(null)
        }
    }

    const getOrdenesByEstado = (estado: string) => {
        return ordenes.filter(o => o.estado === estado)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48 bg-[hsl(var(--surface-highlight))]" />
                    <Skeleton className="h-9 w-32 bg-[hsl(var(--surface-highlight))]" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-[600px] bg-[hsl(var(--surface-highlight))]" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 h-[calc(100vh-8rem)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                        Kanban de Órdenes
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        Arrastra las tarjetas para cambiar el estado
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadOrdenes}
                        className="gap-2 border-[hsl(var(--border-subtle))]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                    </Button>
                    <Link href="/ordenes/nueva">
                        <Button size="sm" className="gap-2 bg-[hsl(var(--brand-accent))]">
                            <Plus className="h-4 w-4" />
                            Nueva Orden
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-4 gap-4 h-full overflow-hidden">
                {columnas.map((columna) => {
                    const Icon = columna.icon
                    const ordenesColumna = getOrdenesByEstado(columna.id)

                    return (
                        <div
                            key={columna.id}
                            className={`flex flex-col rounded-xl border ${columna.borderColor} bg-[hsl(var(--surface-elevated))]/50`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault()
                                const ordenId = e.dataTransfer.getData('ordenId')
                                if (ordenId) {
                                    handleDrop(ordenId, columna.id)
                                }
                            }}
                        >
                            {/* Column Header */}
                            <div className={`px-4 py-3 border-b ${columna.borderColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${columna.color}`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="font-medium text-[hsl(var(--text-primary))]">
                                            {columna.titulo}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="bg-[hsl(var(--surface-highlight))]">
                                        {ordenesColumna.length}
                                    </Badge>
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                <AnimatePresence>
                                    {ordenesColumna.map((orden) => {
                                        const prioridad = prioridadConfig[orden.prioridad] || prioridadConfig.normal
                                        const isUpdating = updatingId === orden.id

                                        return (
                                            <motion.div
                                                key={orden.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileDrag={{ scale: 1.05, zIndex: 50 }}
                                                draggable={!isUpdating}
                                                onDragStart={(e: any) => {
                                                    e.dataTransfer.setData('ordenId', orden.id)
                                                }}
                                                className={`relative p-3 rounded-lg bg-[hsl(var(--surface-base))] border border-[hsl(var(--border-subtle))] cursor-grab active:cursor-grabbing hover:border-[hsl(var(--brand-accent))]/50 transition-all ${isUpdating ? 'opacity-50' : ''}`}
                                            >
                                                {isUpdating && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                                    </div>
                                                )}

                                                {/* Card Header */}
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${prioridad.dot}`} />
                                                        <span className="font-mono text-sm font-medium text-[hsl(var(--text-primary))]">
                                                            {orden.numero}
                                                        </span>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/ordenes/${orden.id}`} className="flex items-center gap-2">
                                                                    <Eye className="h-4 w-4" />
                                                                    Ver detalles
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Equipment */}
                                                <p className="text-sm font-medium text-[hsl(var(--text-primary))] mb-1 line-clamp-1">
                                                    {orden.equipo_tipo}
                                                </p>
                                                <p className="text-xs text-[hsl(var(--text-muted))] mb-2 line-clamp-1">
                                                    {orden.equipo_marca} {orden.equipo_modelo}
                                                </p>

                                                {/* Problem */}
                                                {orden.problema_reportado && (
                                                    <p className="text-xs text-[hsl(var(--text-secondary))] mb-3 line-clamp-2">
                                                        {orden.problema_reportado}
                                                    </p>
                                                )}

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border-subtle))]">
                                                    {orden.cliente ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarFallback className="text-[10px] bg-[hsl(var(--surface-highlight))]">
                                                                    {orden.cliente.nombre.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs text-[hsl(var(--text-muted))] truncate max-w-[100px]">
                                                                {orden.cliente.nombre}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[hsl(var(--text-muted))]">Sin cliente</span>
                                                    )}
                                                    <span className="text-[10px] text-[hsl(var(--text-muted))]">
                                                        {format(new Date(orden.created_at), 'd MMM', { locale: es })}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>

                                {ordenesColumna.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className={`p-3 rounded-full ${columna.bgColor} mb-2`}>
                                            <Icon className={`h-5 w-5 ${columna.color.replace('from-', 'text-').split(' ')[0]}`} />
                                        </div>
                                        <p className="text-xs text-[hsl(var(--text-muted))]">
                                            Sin órdenes
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
