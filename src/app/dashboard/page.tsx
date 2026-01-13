import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ClipboardList, Users, Receipt, Package, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { DashboardCharts } from './dashboard-charts'

export const metadata = {
    title: 'Dashboard',
}

const STATUS_CONFIG = [
    { status: 'open', label: 'Abierto', color: '#3b82f6' },
    { status: 'in_progress', label: 'En proceso', color: '#eab308' },
    { status: 'waiting_parts', label: 'Esperando', color: '#f97316' },
    { status: 'completed', label: 'Completado', color: '#22c55e' },
    { status: 'cancelled', label: 'Cancelado', color: '#ef4444' },
]

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
    const [
        { count: workOrdersCount },
        { count: clientsCount },
        { count: pendingInvoices },
        { count: lowStockProducts },
    ] = await Promise.all([
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['sent', 'overdue']),
        supabase.from('products').select('*', { count: 'exact', head: true }).lte('current_stock', 5),
    ])

    return {
        activeOrders: workOrdersCount || 0,
        totalClients: clientsCount || 0,
        pendingInvoices: pendingInvoices || 0,
        lowStock: lowStockProducts || 0,
    }
}

async function getRevenueData(supabase: Awaited<ReturnType<typeof createClient>>) {
    // Get last 6 months
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
            label: d.toLocaleDateString('es', { month: 'short' }),
        })
    }

    // Get payments (revenue) and accounting entries (expenses)
    const { data: payments } = await supabase.from('payments').select('amount, created_at')
    const { data: entries } = await supabase.from('accounting_entries').select('type, amount, entry_date')

    const revenueData = months.map(m => {
        const monthPayments = payments?.filter(p => {
            const date = p.created_at?.split('T')[0]
            return date && date >= m.start && date <= m.end
        }) || []
        const monthExpenses = entries?.filter(e => {
            return e.type === 'expense' && e.entry_date >= m.start && e.entry_date <= m.end
        }) || []

        return {
            month: m.label,
            revenue: monthPayments.reduce((s, p) => s + (p.amount || 0), 0),
            expenses: monthExpenses.reduce((s, e) => s + (e.amount || 0), 0),
        }
    })

    const totalRevenue = revenueData.reduce((s, m) => s + m.revenue, 0)
    const totalExpenses = revenueData.reduce((s, m) => s + m.expenses, 0)

    return { revenueData, totalRevenue, totalExpenses }
}

async function getOrdersData(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: orders } = await supabase.from('work_orders').select('status')

    return STATUS_CONFIG.map(config => ({
        ...config,
        count: orders?.filter(o => o.status === config.status).length || 0,
    }))
}

async function getRecentOrders(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data } = await supabase
        .from('work_orders')
        .select('id, order_number, status, device_type, client:clients(company_name)')
        .order('created_at', { ascending: false })
        .limit(5)

    return data || []
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const [stats, { revenueData, totalRevenue, totalExpenses }, ordersData, recentOrders] = await Promise.all([
        getStats(supabase),
        getRevenueData(supabase),
        getOrdersData(supabase),
        getRecentOrders(supabase),
    ])

    const statCards = [
        {
            title: 'Órdenes Activas',
            value: stats.activeOrders,
            icon: ClipboardList,
            href: '/dashboard/work-orders',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            title: 'Clientes',
            value: stats.totalClients,
            icon: Users,
            href: '/dashboard/clients',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            title: 'Facturas Pendientes',
            value: stats.pendingInvoices,
            icon: Receipt,
            href: '/dashboard/invoices',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-950',
        },
        {
            title: 'Stock Bajo',
            value: stats.lowStock,
            icon: Package,
            href: '/dashboard/inventory',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950',
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-foreground-secondary">Resumen de tu empresa</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-foreground-secondary">{stat.title}</p>
                                        <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                                    </div>
                                    <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Charts */}
            <DashboardCharts
                revenueData={revenueData}
                ordersData={ordersData}
                totalRevenue={totalRevenue}
                totalExpenses={totalExpenses}
            />

            {/* Recent Orders */}
            <Card>
                <CardHeader>
                    <CardTitle>Órdenes Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-foreground-muted">No hay órdenes recientes</p>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order: { id: string; order_number: string; status: string; device_type: string; client: { company_name: string } | null }) => {
                                const statusConfig = STATUS_CONFIG.find(s => s.status === order.status)
                                return (
                                    <Link
                                        key={order.id}
                                        href={`/dashboard/work-orders/${order.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-foreground">{order.order_number}</p>
                                            <p className="text-sm text-foreground-secondary">
                                                {order.device_type} • {(order.client as { company_name: string } | null)?.company_name || 'Sin cliente'}
                                            </p>
                                        </div>
                                        <span
                                            className="text-xs font-medium px-2 py-1 rounded-full"
                                            style={{ backgroundColor: `${statusConfig?.color}20`, color: statusConfig?.color }}
                                        >
                                            {statusConfig?.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
