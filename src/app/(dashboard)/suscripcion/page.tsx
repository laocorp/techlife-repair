// src/app/(dashboard)/suscripcion/page.tsx
// Subscription management page

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Crown,
    Check,
    Zap,
    Users,
    Package,
    Wrench,
    FileText,
    ArrowRight,
    Calendar,
    CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PlanInfo {
    id: string
    nombre: string
    tipo: string
    max_usuarios: number
    max_ordenes_mes: number
    max_productos: number
    max_facturas_mes: number
}

interface SuscripcionInfo {
    id: string
    estado: string
    fecha_inicio: string
    fecha_fin: string | null
    periodo: string
    plan: PlanInfo
}

interface UsageInfo {
    usuarios: number
    ordenes: number
    productos: number
    facturas: number
}

export default function SuscripcionPage() {
    const { user } = useAuthStore()
    const [suscripcion, setSuscripcion] = useState<SuscripcionInfo | null>(null)
    const [usage, setUsage] = useState<UsageInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const loadSuscripcion = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/suscripcion?empresa_id=${user.empresa_id}`)
            if (!response.ok) throw new Error('Error loading subscription')

            const data = await response.json()

            if (data.suscripcion) {
                setSuscripcion(data.suscripcion as SuscripcionInfo)
            }

            if (data.usage) {
                setUsage(data.usage)
            }
        } catch (error) {
            console.error('Error loading subscription:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadSuscripcion()
    }, [loadSuscripcion])

    const estadoColors: Record<string, string> = {
        activa: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        trial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        vencida: 'bg-red-500/20 text-red-400 border-red-500/30',
        cancelada: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }

    const getPercentage = (current: number, max: number) => {
        if (max >= 9999) return 10 // Unlimited
        return Math.min((current / max) * 100, 100)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Mi Suscripción
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Gestiona tu plan y uso de recursos
                </p>
            </div>

            {suscripcion ? (
                <>
                    {/* Current Plan */}
                    <Card className="card-linear overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                                        <Crown className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">
                                                Plan {suscripcion.plan.nombre}
                                            </h2>
                                            <Badge className={estadoColors[suscripcion.estado] || estadoColors.activa}>
                                                {suscripcion.estado === 'activa' ? 'Activo' : suscripcion.estado}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                            Facturación {suscripcion.periodo}
                                        </p>
                                    </div>
                                </div>
                                <Link href="/pricing">
                                    <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600">
                                        <Zap className="h-4 w-4" />
                                        Mejorar Plan
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                                    <span className="text-sm text-[hsl(var(--text-secondary))]">
                                        Desde {format(new Date(suscripcion.fecha_inicio), 'd MMM yyyy', { locale: es })}
                                    </span>
                                </div>
                                {suscripcion.fecha_fin && (
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                                        <span className="text-sm text-[hsl(var(--text-secondary))]">
                                            Próximo pago: {format(new Date(suscripcion.fecha_fin), 'd MMM yyyy', { locale: es })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage */}
                    <Card className="card-linear">
                        <CardHeader>
                            <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                Uso de Recursos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {usage && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-400" />
                                                <span className="text-sm text-[hsl(var(--text-primary))]">Usuarios</span>
                                            </div>
                                            <span className="text-sm text-[hsl(var(--text-muted))]">
                                                {usage.usuarios} / {suscripcion.plan.max_usuarios >= 9999 ? '∞' : suscripcion.plan.max_usuarios}
                                            </span>
                                        </div>
                                        <Progress value={getPercentage(usage.usuarios, suscripcion.plan.max_usuarios)} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wrench className="h-4 w-4 text-violet-400" />
                                                <span className="text-sm text-[hsl(var(--text-primary))]">Órdenes (mes)</span>
                                            </div>
                                            <span className="text-sm text-[hsl(var(--text-muted))]">
                                                {usage.ordenes} / {suscripcion.plan.max_ordenes_mes >= 9999 ? '∞' : suscripcion.plan.max_ordenes_mes}
                                            </span>
                                        </div>
                                        <Progress value={getPercentage(usage.ordenes, suscripcion.plan.max_ordenes_mes)} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-emerald-400" />
                                                <span className="text-sm text-[hsl(var(--text-primary))]">Productos</span>
                                            </div>
                                            <span className="text-sm text-[hsl(var(--text-muted))]">
                                                {usage.productos} / {suscripcion.plan.max_productos >= 9999 ? '∞' : suscripcion.plan.max_productos}
                                            </span>
                                        </div>
                                        <Progress value={getPercentage(usage.productos, suscripcion.plan.max_productos)} className="h-2" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-amber-400" />
                                                <span className="text-sm text-[hsl(var(--text-primary))]">Facturas (mes)</span>
                                            </div>
                                            <span className="text-sm text-[hsl(var(--text-muted))]">
                                                {usage.facturas} / {suscripcion.plan.max_facturas_mes >= 9999 ? '∞' : suscripcion.plan.max_facturas_mes}
                                            </span>
                                        </div>
                                        <Progress value={getPercentage(usage.facturas, suscripcion.plan.max_facturas_mes)} className="h-2" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* No subscription */
                <Card className="card-linear">
                    <CardContent className="p-8 text-center">
                        <Crown className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                            Sin suscripción activa
                        </h2>
                        <p className="text-sm text-[hsl(var(--text-muted))] mt-2 mb-6">
                            Elige un plan para continuar usando RepairApp
                        </p>
                        <Link href="/pricing">
                            <Button className="gap-2 bg-[hsl(var(--brand-accent))]">
                                Ver Planes
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </motion.div>
    )
}
