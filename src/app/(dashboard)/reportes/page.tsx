// src/app/(dashboard)/reportes/page.tsx
// Reports and analytics dashboard

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Wrench,
    Users,
    Package,
    Download,
    Calendar,
    ArrowUp,
    ArrowDown,
    RefreshCw,
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReportStats {
    ventas_total: number
    ordenes_completadas: number
    ordenes_pendientes: number
    clientes_nuevos: number
    productos_vendidos: number
    ingreso_promedio: number
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function ReportesPage() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [periodo, setPeriodo] = useState('mes')
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadReports()
    }, [user?.empresa_id, periodo])

    const loadReports = async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            let startDate: Date
            const endDate = new Date()

            switch (periodo) {
                case 'semana':
                    startDate = subDays(new Date(), 7)
                    break
                case 'mes':
                    startDate = startOfMonth(new Date())
                    break
                case 'trimestre':
                    startDate = subDays(new Date(), 90)
                    break
                case 'año':
                    startDate = new Date(new Date().getFullYear(), 0, 1)
                    break
                default:
                    startDate = startOfMonth(new Date())
            }

            // Get sales
            const { data: ventas } = await supabase
                .from('ventas')
                .select('total')
                .eq('empresa_id', user.empresa_id)
                .gte('created_at', startDate.toISOString())

            const ventasTotal = ventas?.reduce((acc, v) => acc + (v.total || 0), 0) || 0

            // Get orders
            const { count: ordenesCompletadas } = await supabase
                .from('ordenes_servicio')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .eq('estado', 'entregado')
                .gte('created_at', startDate.toISOString())

            const { count: ordenesPendientes } = await supabase
                .from('ordenes_servicio')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .neq('estado', 'entregado')

            // Get new clients
            const { count: clientesNuevos } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .gte('created_at', startDate.toISOString())

            setStats({
                ventas_total: ventasTotal,
                ordenes_completadas: ordenesCompletadas || 0,
                ordenes_pendientes: ordenesPendientes || 0,
                clientes_nuevos: clientesNuevos || 0,
                productos_vendidos: 0,
                ingreso_promedio: ventas?.length ? ventasTotal / ventas.length : 0,
            })

        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const statCards = [
        {
            title: 'Ventas Totales',
            value: `$${(stats?.ventas_total || 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            trend: '+12%',
            trendUp: true,
        },
        {
            title: 'Órdenes Completadas',
            value: stats?.ordenes_completadas || 0,
            icon: Wrench,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            trend: '+5',
            trendUp: true,
        },
        {
            title: 'Órdenes Pendientes',
            value: stats?.ordenes_pendientes || 0,
            icon: Wrench,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            trend: '-2',
            trendUp: false,
        },
        {
            title: 'Clientes Nuevos',
            value: stats?.clientes_nuevos || 0,
            icon: Users,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/10',
            trend: '+8',
            trendUp: true,
        },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                        Reportes y Análisis
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        Métricas de rendimiento de tu negocio
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={periodo} onValueChange={setPeriodo}>
                        <SelectTrigger className="w-[140px] input-linear">
                            <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--text-muted))]" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                            <SelectItem value="semana">Última semana</SelectItem>
                            <SelectItem value="mes">Este mes</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="año">Este año</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadReports}
                        className="border-[hsl(var(--border-subtle))]"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 bg-[hsl(var(--surface-highlight))]" />
                    ))
                ) : (
                    statCards.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <Card key={index} className="stat-card">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                            <Icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {stat.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                            {stat.trend}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                            {stat.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </motion.div>

            {/* Charts Placeholder */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-linear">
                    <CardHeader>
                        <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                            Ventas por Período
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                Gráfico de ventas próximamente
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-linear">
                    <CardHeader>
                        <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                            Órdenes por Estado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                Gráfico de órdenes próximamente
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Export Section */}
            <motion.div variants={itemVariants}>
                <Card className="card-linear">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-[hsl(var(--text-primary))]">
                                Exportar Reportes
                            </p>
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                Descarga los datos en formato Excel o PDF
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2 border-[hsl(var(--border-subtle))]">
                                <Download className="h-4 w-4" />
                                Excel
                            </Button>
                            <Button variant="outline" className="gap-2 border-[hsl(var(--border-subtle))]">
                                <Download className="h-4 w-4" />
                                PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
