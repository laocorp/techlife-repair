// src/app/(cliente)/equipos/page.tsx
// Customer Dashboard - Premium Glass Redesign

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
    ArrowRight,
    Smartphone
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

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
    recibido: { label: 'Recibido', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Wrench },
    cotizado: { label: 'Cotizado', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', icon: Wrench },
    terminado: { label: 'Listo para Retirar', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle },
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export default function ClienteDashboard() {
    const [ordenes, setOrdenes] = useState<OrdenActiva[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadOrdenes = useCallback(async () => {
        setIsLoading(true)
        try {
            const stored = localStorage.getItem('cliente_portal')
            if (!stored) return

            const cliente = JSON.parse(stored)

            const response = await fetch(`/api/ordenes?cliente_id=${cliente.id}`)
            if (!response.ok) throw new Error('Error loading orders')

            const data = await response.json()
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
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Mis Equipos
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Gestiona tus equipos en proceso de reparación
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={loadOrdenes}
                    className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm rounded-xl"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute right-0 top-0 p-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform duration-300">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <p className="text-4xl font-bold text-slate-900 mb-1">{ordenesActivas.length}</p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">En Taller</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute right-0 top-0 p-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:rotate-12 transition-transform duration-300">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <p className="text-4xl font-bold text-slate-900 mb-1">{ordenesListas.length}</p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Listos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute right-0 top-0 p-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform duration-300">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <p className="text-4xl font-bold text-slate-900 mb-1">{ordenesPendienteCotizacion.length}</p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Por Aprobar</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Smart Alerts */}
            {ordenesPendienteCotizacion.length > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-200 to-orange-200 shadow-lg shadow-orange-500/10">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0 animate-pulse">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-slate-900 text-lg">Cotización pendiente</h3>
                                <p className="text-slate-600">
                                    Tienes {ordenesPendienteCotizacion.length} equipo(s) esperando tu aprobación para continuar.
                                </p>
                            </div>
                            <Link href={`/tracking/${ordenesPendienteCotizacion[0].id}`}>
                                <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 rounded-xl px-8">
                                    Revisar Ahora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}

            {ordenesListas.length > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="p-1 rounded-2xl bg-gradient-to-r from-emerald-200 to-teal-200 shadow-lg shadow-emerald-500/10">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-slate-900 text-lg">¡Equipo listo para retirar!</h3>
                                <p className="text-slate-600">
                                    Puedes pasar por nuestro taller para recoger tu equipo reparado.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Main List */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Órdenes en Curso</h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/50" />
                        ))}
                    </div>
                ) : ordenesActivas.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Package className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold text-slate-900 text-lg">No hay equipos en taller</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                                Actualmente no tienes ninguna orden activa. Cuando traigas un equipo, aparecerá aquí automáticamente.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {ordenesActivas.map((orden) => {
                            const estado = estadoConfig[orden.estado] || estadoConfig.recibido
                            const Icon = estado.icon

                            return (
                                <Link key={orden.id} href={`/tracking/${orden.id}`}>
                                    <div className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            {/* Icon Brand */}
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Smartphone className="h-7 w-7 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {orden.equipo_tipo} {orden.equipo_marca}
                                                    </h3>
                                                    <Badge variant="outline" className="font-mono text-[10px] text-slate-400 bg-slate-50 border-slate-200">
                                                        {orden.numero}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(orden.created_at), "d MMM yyyy", { locale: es })}
                                                    </span>
                                                    {orden.equipo_modelo && (
                                                        <span>• {orden.equipo_modelo}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status & Price */}
                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                                                <Badge className={`${estado.bgColor} ${estado.color} border ${estado.borderColor} px-3 py-1.5 rounded-lg flex items-center gap-1.5`}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {estado.label}
                                                </Badge>
                                                {orden.costo_estimado && (
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-400 font-medium">Estimado</p>
                                                        <p className="font-bold text-lg text-slate-900">${orden.costo_estimado.toFixed(2)}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 hidden md:block">
                                                <ArrowRight className="h-5 w-5 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}
