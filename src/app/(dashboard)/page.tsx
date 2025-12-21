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
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import charts to reduce initial bundle size
const DashboardCharts = dynamic(
    () => import('@/components/dashboard/dashboard-charts'),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="chart-container h-[300px] flex items-center justify-center">
                    <div className="skeleton h-full w-full rounded-xl bg-zinc-800/50" />
                </div>
                <div className="chart-container h-[300px] flex items-center justify-center">
                    <div className="skeleton h-full w-full rounded-xl bg-zinc-800/50" />
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
    recibido: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Recibido', dot: 'bg-zinc-400' },
    en_diagnostico: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Diagnóstico', dot: 'bg-blue-400' },
    cotizado: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Cotizado', dot: 'bg-amber-400' },
    aprobado: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Aprobado', dot: 'bg-violet-400' },
    en_reparacion: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'En Reparación', dot: 'bg-cyan-400' },
    terminado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Terminado', dot: 'bg-emerald-400' },
    entregado: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Entregado', dot: 'bg-green-400' },
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const { empresa, isLoading: tenantLoading } = useTenant()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [lowStock, setLowStock] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const loadDashboardData = async () => {
        if (!user?.empresa_id) return

        try {
            // Get recent orders
            const { data: ordersData } = await supabase
                .from('ordenes_servicio')
                .select('*, cliente:clientes(nombre)')
                .eq('empresa_id', user.empresa_id)
                .neq('estado', 'entregado')
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentOrders(ordersData || [])

            // Get low stock products
            const { data: stockData } = await supabase
                .from('productos')
                .select('id, nombre, stock, stock_minimo')
                .eq('empresa_id', user.empresa_id)
                .eq('activo', true)
                .order('stock', { ascending: true })
                .limit(5)

            const filtered = stockData?.filter(p => p.stock <= p.stock_minimo) || []
            setLowStock(filtered)

            // Count active orders
            const { count: ordenesActivas } = await supabase
                .from('ordenes_servicio')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .neq('estado', 'entregado')

            // Count completed orders
            const { count: ordenesCompletadas } = await supabase
                .from('ordenes_servicio')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .eq('estado', 'entregado')

            // Count orders today
            const today = new Date().toISOString().split('T')[0]
            const { count: ordenesHoy } = await supabase
                .from('ordenes_servicio')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)
                .gte('created_at', today)

            // Count total clients
            const { count: clientesTotal } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', user.empresa_id)

            // Get sales this month
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
            const { data: ventasData } = await supabase
                .from('ventas')
                .select('total')
                .eq('empresa_id', user.empresa_id)
                .gte('created_at', startOfMonth)

            const ventasMes = ventasData?.reduce((acc, v) => acc + (v.total || 0), 0) || 0

            setStats({
                ordenes_activas: ordenesActivas || 0,
                ordenes_hoy: ordenesHoy || 0,
                ventas_hoy: 0,
                ventas_mes: ventasMes,
                clientes_total: clientesTotal || 0,
                clientes_nuevos_mes: 0,
                productos_stock_bajo: filtered.length,
                ordenes_completadas: ordenesCompletadas || 0,
            })

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()

        const channel = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_servicio' }, () => loadDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => loadDashboardData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [user?.empresa_id])

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
                    <h1 className="text-2xl font-semibold text-white tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
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
                                className="h-9 gap-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-semibold shadow-lg shadow-cyan-500/25"
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
                            <div className="stat-card-enterprise group cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                            {stat.title}
                                        </p>
                                        {isLoading ? (
                                            <div className="skeleton h-8 w-20 mt-2" />
                                        ) : (
                                            <p className="text-2xl font-bold text-white mt-1 tracking-tight">
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
            <DashboardCharts stats={stats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <PermissionGate permission="orders.view">
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <div className="card-enterprise">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Órdenes Activas</h3>
                                        <p className="text-xs text-zinc-500">En proceso de reparación</p>
                                    </div>
                                </div>
                                <Link href="/ordenes">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-xs text-zinc-500 hover:text-white"
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
                                    <div className="divide-y divide-zinc-800/50">
                                        {recentOrders.map((order) => {
                                            const estado = estadoColors[order.estado] || estadoColors.recibido
                                            return (
                                                <Link key={order.id} href={`/ordenes/${order.id}`}>
                                                    <div className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                                                                <Wrench className="h-4 w-4 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-white">
                                                                    {order.equipo}
                                                                </p>
                                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                                    {order.cliente?.nombre || 'Sin cliente'} · {order.numero_orden}
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
                        <div className="card-enterprise">
                            <div className="flex items-center gap-3 p-5 border-b border-zinc-800/50">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Stock Bajo</h3>
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
                                            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30">
                                                <p className="text-sm font-medium text-zinc-300 truncate flex-1">
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
                    <div className="card-enterprise p-5">
                        <h3 className="text-sm font-semibold text-white mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Link href="/ordenes/nueva">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-cyan-500/50"
                                >
                                    <Wrench className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Nueva Orden</span>
                                </Button>
                            </Link>
                            <Link href="/pos">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-cyan-500/50"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Venta</span>
                                </Button>
                            </Link>
                            <Link href="/clientes/nuevo">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-cyan-500/50"
                                >
                                    <Users className="h-5 w-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Cliente</span>
                                </Button>
                            </Link>
                            <Link href="/reportes">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-20 flex-col gap-2 border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-cyan-500/50"
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
