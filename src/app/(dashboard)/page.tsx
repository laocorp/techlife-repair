import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ClipboardList, Users, Receipt, Package } from 'lucide-react'

export const metadata = {
    title: 'Dashboard',
}

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

export default async function DashboardPage() {
    const supabase = await createClient()
    const stats = await getStats(supabase)

    const statCards = [
        {
            title: 'Órdenes Activas',
            value: stats.activeOrders,
            icon: ClipboardList,
            description: 'Abiertas y en proceso',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            title: 'Clientes',
            value: stats.totalClients,
            icon: Users,
            description: 'Total registrados',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            title: 'Facturas Pendientes',
            value: stats.pendingInvoices,
            icon: Receipt,
            description: 'Por cobrar',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-950',
        },
        {
            title: 'Stock Bajo',
            value: stats.lowStock,
            icon: Package,
            description: 'Productos con bajo inventario',
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
                    <Card key={stat.title}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-foreground-secondary">{stat.title}</p>
                                    <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                                    <p className="mt-1 text-xs text-foreground-muted">{stat.description}</p>
                                </div>
                                <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Órdenes Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">No hay órdenes recientes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Actividad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">No hay actividad reciente</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
