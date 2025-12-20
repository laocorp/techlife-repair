'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { useTenant } from '@/hooks'
import { PermissionGate, getRoleDisplayName } from '@/hooks/use-permissions'
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
    TrendingDown,
    Clock,
    CheckCircle,
    AlertTriangle,
    Package,
    ArrowRight,
    Plus,
    ArrowUpRight,
    Activity,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

// Stagger animation for cards
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut" as const
        }
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
    pagos_pendientes: number
}

const estadoColors: Record<string, { bg: string; text: string; label: string }> = {
    recibido: { bg: 'bg-[hsl(var(--surface-highlight))]', text: 'text-[hsl(var(--text-secondary))]', label: 'Recibido' },
    en_diagnostico: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'En Diagnóstico' },
    cotizado: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Cotizado' },
    aprobado: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Aprobado' },
    en_reparacion: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'En Reparación' },
    terminado: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Terminado' },
    entregado: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Entregado' },
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
                pagos_pendientes: 0,
            })

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()

        // Real-time subscription for live updates
        const channel = supabase
            .channel('dashboard-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ordenes_servicio' },
                () => {
                    console.log('📡 Realtime: Ordenes update')
                    loadDashboardData()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ventas' },
                () => {
                    console.log('📡 Realtime: Ventas update')
                    loadDashboardData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.empresa_id])

    const statCards = [
        {
            title: 'Órdenes Activas',
            value: stats?.ordenes_activas || 0,
            icon: Wrench,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            href: '/ordenes',
        },
        {
            title: 'Total Clientes',
            value: stats?.clientes_total || 0,
            icon: Users,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/10',
            href: '/clientes',
        },
        {
            title: 'Stock Bajo',
            value: stats?.productos_stock_bajo || 0,
            icon: Package,
            color: stats?.productos_stock_bajo ? 'text-amber-400' : 'text-emerald-400',
            bgColor: stats?.productos_stock_bajo ? 'bg-amber-500/10' : 'bg-emerald-500/10',
            href: '/inventario',
        },
        {
            title: 'Ventas del Mes',
            value: `$${(stats?.ventas_mes || 0).toFixed(0)}`,
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            href: '/reportes',
        },
    ]

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Welcome Section - Linear style */}
            <motion.div variants={itemVariants} className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))] tracking-tight">
                        Bienvenido, {user?.nombre?.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        Aquí está el resumen de tu negocio
                    </p>
                </div>

                <div className="flex gap-2">
                    <PermissionGate permission="orders.create">
                        <Link href="/ordenes/nueva">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Nueva Orden
                            </Button>
                        </Link>
                    </PermissionGate>
                    <PermissionGate permission="pos.sell">
                        <Link href="/pos">
                            <Button
                                size="sm"
                                className="h-8 gap-1.5 bg-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--brand-accent))]/90 text-white"
                            >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                Nueva Venta
                            </Button>
                        </Link>
                    </PermissionGate>
                </div>
            </motion.div>

            {/* Stats Grid - Minimal Linear style */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="stat-card group cursor-pointer">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="stat-label">{stat.title}</p>
                                            {isLoading ? (
                                                <Skeleton className="h-8 w-16 mt-1 bg-[hsl(var(--surface-highlight))]" />
                                            ) : (
                                                <p className="stat-value mt-1">{stat.value}</p>
                                            )}
                                        </div>
                                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                            <Icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-xs text-[hsl(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Ver detalles</span>
                                        <ArrowUpRight className="h-3 w-3 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <PermissionGate permission="orders.view">
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="card-linear">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                        Órdenes Recientes
                                    </CardTitle>
                                </div>
                                <Link href="/ordenes">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                                    >
                                        Ver todas <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-14 w-full bg-[hsl(var(--surface-highlight))]" />
                                        ))}
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Activity className="h-10 w-10 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                        <p className="text-sm text-[hsl(var(--text-muted))]">No hay órdenes activas</p>
                                        <Link href="/ordenes/nueva">
                                            <Button variant="link" size="sm" className="mt-2 text-[hsl(var(--brand-accent))]">
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
                                                    <div className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--interactive-hover))] transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--surface-highlight))] flex items-center justify-center">
                                                                <Wrench className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                                                    {order.equipo}
                                                                </p>
                                                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                                                    {order.cliente?.nombre || 'Sin cliente'} · {order.numero_orden}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge className={`${estado.bg} ${estado.text} border-0 text-[10px] font-medium`}>
                                                            {estado.label}
                                                        </Badge>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </PermissionGate>

                {/* Low Stock Alert */}
                <PermissionGate permission="inventory.view">
                    <motion.div variants={itemVariants}>
                        <Card className="card-linear h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                        Stock Bajo
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full bg-[hsl(var(--surface-highlight))]" />
                                        ))}
                                    </div>
                                ) : lowStock.length === 0 ? (
                                    <div className="text-center py-6">
                                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-sm text-[hsl(var(--text-muted))]">Todo el stock está bien</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lowStock.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">
                                                        {product.nombre}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-400 border-0 text-[10px]">
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
                                        className="w-full mt-4 h-8 text-xs border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--interactive-hover))]"
                                    >
                                        <Package className="h-3 w-3 mr-1.5" />
                                        Ver Inventario
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </PermissionGate>
            </div>

            {/* Quick Stats Banner */}
            <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-blue-600 to-violet-600 border-0 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-white/70 text-sm">Ventas del Mes</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    ${(stats?.ventas_mes || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <PermissionGate permission="reports.view">
                                    <Link href="/reportes">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 gap-1.5 bg-white/10 hover:bg-white/20 text-white border-0"
                                        >
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            Ver Reportes
                                        </Button>
                                    </Link>
                                </PermissionGate>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
