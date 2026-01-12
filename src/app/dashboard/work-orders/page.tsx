import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge } from '@/components/ui'
import { Plus, Search, ClipboardList, User, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants/statuses'

export const metadata = {
    title: 'Órdenes de Trabajo',
}

interface WorkOrder {
    id: string
    order_number: string
    status: string
    priority: string
    device_type: string | null
    device_brand: string | null
    device_model: string | null
    problem_description: string
    created_at: string
    client: {
        id: string
        company_name: string
    }
    assigned_user: {
        id: string
        full_name: string
    } | null
}

async function getWorkOrders(supabase: Awaited<ReturnType<typeof createClient>>): Promise<WorkOrder[]> {
    const { data, error } = await supabase
        .from('work_orders')
        .select(`
      id,
      order_number,
      status,
      priority,
      device_type,
      device_brand,
      device_model,
      problem_description,
      created_at,
      client:clients(id, company_name),
      assigned_user:users!work_orders_assigned_to_fkey(id, full_name)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching work orders:', error)
        return []
    }

    return (data || []).map(wo => ({
        ...wo,
        client: wo.client as unknown as { id: string; company_name: string },
        assigned_user: wo.assigned_user as unknown as { id: string; full_name: string } | null,
    }))
}

export default async function WorkOrdersPage() {
    const supabase = await createClient()
    const workOrders = await getWorkOrders(supabase)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Órdenes de Trabajo</h1>
                    <p className="text-foreground-secondary">
                        Gestiona las reparaciones y servicios
                    </p>
                </div>
                <Link href="/dashboard/work-orders/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nueva Orden
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Buscar órdenes..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background-tertiary text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                </div>
                <select className="h-10 px-3 rounded-lg border border-border bg-background-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Todos los estados</option>
                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Work Orders List */}
            {workOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <ClipboardList className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">
                        No hay órdenes de trabajo
                    </h3>
                    <p className="text-foreground-secondary text-center mb-4">
                        Crea tu primera orden de trabajo
                    </p>
                    <Link href="/dashboard/work-orders/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Nueva Orden
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-background-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Orden
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Equipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Técnico
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {workOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-background-secondary/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/dashboard/work-orders/${order.id}`}
                                            className="font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            {order.order_number}
                                        </Link>
                                        <Badge
                                            variant={order.priority === 'urgent' ? 'error' : order.priority === 'high' ? 'warning' : 'default'}
                                            className="ml-2"
                                        >
                                            {PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS] || order.priority}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/dashboard/clients/${order.client.id}`}
                                            className="text-sm text-foreground hover:text-primary transition-colors"
                                        >
                                            {order.client.company_name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground-secondary">
                                        {[order.device_brand, order.device_model].filter(Boolean).join(' ') || order.device_type || '-'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant={
                                            order.status === 'completed' || order.status === 'delivered' ? 'success' :
                                                order.status === 'cancelled' ? 'error' :
                                                    order.status === 'in_progress' ? 'info' : 'default'
                                        }>
                                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                        {order.assigned_user ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3.5 w-3.5 text-foreground-muted" />
                                                <span className="text-foreground">{order.assigned_user.full_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-foreground-muted">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDate(order.created_at)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
