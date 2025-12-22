// src/app/(cliente)/equipos/page.tsx
// Customer Dashboard - Shows current equipment in repair

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    Package,
    RefreshCw,
    Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrdenActiva {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string | null
    equipo_modelo: string | null
    estado: string
    prioridad: string
    costo_estimado: number | null
    created_at: string
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    recibido: { label: 'Recibido', color: 'text-slate-400', bgColor: 'bg-slate-500/10', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Wrench },
    cotizado: { label: 'Cotizado', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'text-violet-400', bgColor: 'bg-violet-500/10', icon: Wrench },
    terminado: { label: 'Listo para Retirar', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: CheckCircle },
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function ClienteDashboard() {
    const [ordenes, setOrdenes] = useState<OrdenActiva[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadOrdenes = useCallback(async () => {
        setIsLoading(true)
        try {
            // Get cliente from localStorage
            const stored = localStorage.getItem('cliente_portal')
            if (!stored) return

            const cliente = JSON.parse(stored)

            // Get active orders for this client
            const response = await fetch(`/api/ordenes?cliente_id=${cliente.id}`)
            if (!response.ok) throw new Error('Error loading orders')

            const data = await response.json()
            // Filter out delivered orders
            setOrdenes(data.filter((o: any) => o.estado !== 'entregado'))
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadOrdenes()
    }, [loadOrdenes])

    const ordenesActivas = ordenes.filter(o => o.estado !== 'entregado')
    const ordenesListas = ordenes.filter(o => o.estado === 'terminado')
    const ordenesPendienteCotizacion = ordenes.filter(o => o.estado === 'cotizado')

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Welcome */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                        Mis Equipos en Taller
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        Estado actual de tus equipos en reparación
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOrdenes}
                    className="gap-2 border-[hsl(var(--border-subtle))]"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                <Card className="card-linear">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">{ordenesActivas.length}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">En Taller</p>
                    </CardContent>
                </Card>
                <Card className="card-linear">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">{ordenesListas.length}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">Listos</p>
                    </CardContent>
                </Card>
                <Card className="card-linear">
                    <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">{ordenesPendienteCotizacion.length}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">Por Aprobar</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Pending Approval Alert */}
            {ordenesPendienteCotizacion.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-[hsl(var(--text-primary))]">
                                    Tienes {ordenesPendienteCotizacion.length} cotización(es) pendiente(s)
                                </p>
                                <p className="text-sm text-[hsl(var(--text-muted))]">
                                    Revisa y aprueba para continuar con la reparación
                                </p>
                            </div>
                            <Link href={`/tracking/${ordenesPendienteCotizacion[0].id}`}>
                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                                    Ver Cotización
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Ready for Pickup Alert */}
            {ordenesListas.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-[hsl(var(--text-primary))]">
                                    ¡{ordenesListas.length} equipo(s) listo(s) para retirar!
                                </p>
                                <p className="text-sm text-[hsl(var(--text-muted))]">
                                    Pasa por el taller para recoger tu equipo
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Orders List */}
            <motion.div variants={itemVariants}>
                <Card className="card-linear">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                            Órdenes Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full bg-[hsl(var(--surface-highlight))]" />
                                ))}
                            </div>
                        ) : ordenes.length === 0 ? (
                            <div className="p-8 text-center">
                                <Package className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                <p className="text-[hsl(var(--text-secondary))]">No tienes equipos en taller</p>
                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                    Cuando dejes un equipo, aparecerá aquí
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[hsl(var(--border-subtle))]">
                                {ordenes.map((orden) => {
                                    const estado = estadoConfig[orden.estado] || estadoConfig.recibido
                                    const Icon = estado.icon
                                    return (
                                        <Link key={orden.id} href={`/tracking/${orden.id}`}>
                                            <div className="p-4 hover:bg-[hsl(var(--interactive-hover))] transition-colors cursor-pointer">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg ${estado.bgColor} flex items-center justify-center`}>
                                                            <Icon className={`h-5 w-5 ${estado.color}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[hsl(var(--text-primary))]">
                                                                {orden.equipo_tipo}
                                                            </p>
                                                            <p className="text-xs text-[hsl(var(--text-muted))]">
                                                                {orden.equipo_marca} {orden.equipo_modelo} · {orden.numero}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={`${estado.bgColor} ${estado.color} border-0 text-[10px]`}>
                                                        {estado.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[hsl(var(--text-muted))] flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(orden.created_at), "d 'de' MMM", { locale: es })}
                                                    </span>
                                                    {orden.costo_estimado && (
                                                        <span className="text-emerald-400 font-medium">
                                                            ${orden.costo_estimado.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Help Section */}
            <motion.div variants={itemVariants}>
                <Card className="card-linear">
                    <CardContent className="p-4">
                        <p className="text-sm text-[hsl(var(--text-secondary))] mb-2">
                            ¿Necesitas ayuda?
                        </p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">
                            Contacta al taller directamente para consultas sobre tu equipo.
                            Puedes ver los detalles de cada orden haciendo clic en ella.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
