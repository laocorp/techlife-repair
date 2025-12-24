'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { useTenant } from '@/hooks'
import { PermissionGate } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DollarSign,
    ShoppingCart,
    Wrench,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    Package,
    ArrowRight,
    Plus,
    ArrowUpRight,
    Activity,
    CircleDot,
    Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import charts to reduce initial bundle size
const DashboardCharts = dynamic(
    () => import('@/components/dashboard/dashboard-charts'),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="chart-container h-[300px] flex items-center justify-center">
                    <div className="skeleton h-full w-full rounded-xl bg-slate-100" />
                </div>
                <div className="chart-container h-[300px] flex items-center justify-center">
                    <div className="skeleton h-full w-full rounded-xl bg-slate-100" />
                </div>
            </div>
        )
    }
)

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const }
    },
}

interface DashboardStats {
    ordenes_activas: number
    ordenes_hoy: number
    ventas_hoy: number
    ventas_mes: number
    clientes_total: number
    clientes_nuevos_mes: number
    productos_stock_bajo: number
    ordenes_completadas: number
}

const estadoColors: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    recibido: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Recibido', dot: 'bg-slate-400' },
    en_diagnostico: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Diagnóstico', dot: 'bg-blue-500' },
    cotizado: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Cotizado', dot: 'bg-amber-500' },
    aprobado: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Aprobado', dot: 'bg-violet-500' },
    en_reparacion: { bg: 'bg-sky-50', text: 'text-sky-700', label: 'En Reparación', dot: 'bg-sky-500' },
    terminado: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Terminado', dot: 'bg-emerald-500' },
    entregado: { bg: 'bg-green-50', text: 'text-green-700', label: 'Entregado', dot: 'bg-green-500' },
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const { empresa, isLoading: tenantLoading } = useTenant()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [charts, setCharts] = useState<any[]>([])
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [lowStock, setLowStock] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadDashboardData = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const response = await fetch(`/api/dashboard?empresa_id=${user.empresa_id}`)

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data')
            }

            const data = await response.json()

            setStats(data.stats)
            setCharts(data.charts || [])
            setRecentOrders(data.recentOrders || [])
            setLowStock(data.lowStock || [])
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadDashboardData()

        // Poll every 30 seconds for updates
        const interval = setInterval(loadDashboardData, 30000)
        return () => clearInterval(interval)
    }, [loadDashboardData])

    const statCards = [
        {
            title: 'Órdenes Activas',
            value: stats?.ordenes_activas || 0,
            icon: Wrench,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            glowColor: 'shadow-cyan-500/20',
            href: '/ordenes',
            trend: '+12%',
            trendUp: true,
        },
        {
            title: 'Completadas',
            value: stats?.ordenes_completadas || 0,
            icon: CheckCircle,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            glowColor: 'shadow-emerald-500/20',
            href: '/ordenes?estado=entregado',
            trend: '+8%',
            trendUp: true,
        },
        {
            title: 'Clientes',
            value: stats?.clientes_total || 0,
            icon: Users,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/10',
            glowColor: 'shadow-violet-500/20',
            href: '/clientes',
            trend: '+5%',
            trendUp: true,
        },
        {
            title: 'Ingresos',
            value: `$${((stats?.ventas_mes || 0) / 1000).toFixed(1)}k`,
            icon: DollarSign,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            glowColor: 'shadow-amber-500/20',
            href: '/reportes',
            trend: '+23%',
            trendUp: true,
        },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 p-1"
        >
            {/* Welcome Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                        Bienvenido, {user?.nombre?.split(' ')[0]} · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="flex gap-2">
                    <PermissionGate permission="orders.create">
                        <Link href="/ordenes/nueva">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-2 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva Orden
                            </Button>
                        </Link>
                    </PermissionGate>
                    <PermissionGate permission="pos.sell">
                        <Link href="/pos">
                            <Button
                                size="sm"
                                className="h-9 gap-2 bg-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--brand-accent))]/90 text-white font-semibold shadow-lg shadow-blue-500/25"
                            >
                                <Zap className="h-4 w-4" />
                                Nueva Venta
                            </Button>
                        </Link>
                    </PermissionGate>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <div className="stat-card-enterprise group cursor-pointer bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">
                                            {stat.title}
                                        </p>
                                        {isLoading ? (
                                            <div className="skeleton h-8 w-20 mt-2 bg-slate-200/50" />
                                        ) : (
                                            <p className="text-2xl font-bold text-[hsl(var(--text-primary))] mt-1 tracking-tight">
                                                {stat.value}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                                            <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
                                            <span className="text-xs text-zinc-600">vs mes anterior</span>
                                        </div>
                                    </div>
                                    <div className={`icon-container ${stat.bgColor} group-hover:shadow-lg ${stat.glowColor}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </motion.div>

            {/* Charts Row - Now Dynamically Loaded */}
            <DashboardCharts stats={stats} charts={charts} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <PermissionGate permission="orders.view">
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <div className="card-enterprise bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                            <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border-subtle))]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-cyan-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Órdenes Activas</h3>
                                        <p className="text-xs text-zinc-500">En proceso de reparación</p>
                                    </div>
                                </div>
                                <Link href="/ordenes">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                                    >
                                        Ver todas <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="p-0">
                                {isLoading ? (
                                    <div className="p-5 space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="skeleton h-16 w-full" />
                                        ))}
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                                            <Wrench className="h-6 w-6 text-zinc-600" />
                                        </div>
                                        <p className="text-sm text-zinc-500">No hay órdenes activas</p>
                                        <Link href="/ordenes/nueva">
                                            <Button variant="link" size="sm" className="mt-2 text-cyan-400 hover:text-cyan-300">
                                                Crear primera orden
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[hsl(var(--border-subtle))]">
                                        {recentOrders.map((order) => {
                                            const estado = estadoColors[order.estado] || estadoColors.recibido
                                            return (
                                                <Link key={order.id} href={`/ordenes/${order.id}`}>
                                                    <div className="flex items-center justify-between px-5 py-4 hover:bg-[hsl(var(--surface-highlight))] transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                                                                <Wrench className="h-4 w-4 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                                                    {order.equipo_tipo} {order.equipo_marca}
                                                                </p>
                                                                <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                                                                    {order.cliente?.nombre || 'Sin cliente'} · {order.numero}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`${estado.bg} ${estado.text} border-0 text-[10px] font-semibold uppercase tracking-wider`}>
                                                                <CircleDot className={`h-2 w-2 mr-1 ${estado.dot}`} />
                                                                {estado.label}
                                                            </Badge>
                                                            <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </PermissionGate>

                {/* Stock Alerts & Quick Actions */}
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Low Stock */}
                    <PermissionGate permission="inventory.view">
                        <div className="card-enterprise bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                            <div className="flex items-center gap-3 p-5 border-b border-[hsl(var(--border-subtle))]">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Stock Bajo</h3>
                                    <p className="text-xs text-zinc-500">Productos a reabastecer</p>
                                </div>
                            </div>
                            <div className="p-5">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="skeleton h-10 w-full" />
                                        ))}
                                    </div>
                                ) : lowStock.length === 0 ? (
                                    <div className="text-center py-4">
                                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-sm text-zinc-500">Todo el stock está bien</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lowStock.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--surface-highlight))]">
                                                <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate flex-1">
                                                    {product.nombre}
                                                </p>
                                                <Badge className="ml-2 bg-amber-500/10 text-amber-400 border-0 text-[10px] font-semibold">
                                                    {product.stock}/{product.stock_minimo}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Link href="/inventario">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-4 h-9 text-xs border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                                    >
                                        <Package className="h-3.5 w-3.5 mr-2" />
                                        Ver Inventario
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </PermissionGate>

                    {/* Quick Actions */}
                    <div className="card-enterprise p-5 bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
                        <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Link href="/ordenes/nueva">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-[hsl(var(--border-subtle))] bg-white/50 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-white hover:border-[hsl(var(--brand-accent))]"
                                >
                                    <Wrench className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Nueva Orden</span>
                                </Button>
                            </Link>
                            <Link href="/pos">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-[hsl(var(--border-subtle))] bg-white/50 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-white hover:border-[hsl(var(--brand-accent))]"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Venta</span>
                                </Button>
                            </Link>
                            <Link href="/clientes/nuevo">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-[hsl(var(--border-subtle))] bg-white/50 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-white hover:border-[hsl(var(--brand-accent))]"
                                >
                                    <Users className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Cliente</span>
                                </Button>
                            </Link>
                            <Link href="/reportes">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-[hsl(var(--border-subtle))] bg-white/50 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-white hover:border-[hsl(var(--brand-accent))]"
                                >
                                    <TrendingUp className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Reportes</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
