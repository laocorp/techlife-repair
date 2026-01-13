import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Pencil, User, Clock, Smartphone, FileText, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ORDER_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants/statuses'
import { StatusActions } from './status-actions'
import { WorkOrderExportButton } from '@/components/export'

interface WorkOrderPageProps {
    params: Promise<{ id: string }>
}

interface WorkOrder {
    id: string
    order_number: string
    status: string
    priority: string
    device_type: string | null
    device_brand: string | null
    device_model: string | null
    device_serial: string | null
    problem_description: string
    diagnosis: string | null
    estimated_cost: number | null
    final_cost: number | null
    received_at: string
    completed_at: string | null
    delivered_at: string | null
    created_at: string
    client: {
        id: string
        company_name: string
        email: string | null
        phone: string | null
    }
    assigned_user: {
        id: string
        full_name: string
    } | null
}

async function getWorkOrder(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
        .from('work_orders')
        .select(`
      *,
      client:clients(id, company_name, email, phone),
      assigned_user:users!work_orders_assigned_to_fkey(id, full_name)
    `)
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return {
        ...data,
        client: data.client as unknown as WorkOrder['client'],
        assigned_user: data.assigned_user as unknown as WorkOrder['assigned_user'],
    }
}

export default async function WorkOrderDetailPage({ params }: WorkOrderPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const order = await getWorkOrder(supabase, id)

    if (!order) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back button */}
            <Link
                href="/dashboard/work-orders"
                className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a Órdenes
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-foreground">
                            {order.order_number}
                        </h1>
                        <Badge variant={
                            order.status === 'completed' || order.status === 'delivered' ? 'success' :
                                order.status === 'cancelled' ? 'error' :
                                    order.status === 'in_progress' ? 'info' : 'default'
                        }>
                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                        </Badge>
                        <Badge variant={
                            order.priority === 'urgent' ? 'error' :
                                order.priority === 'high' ? 'warning' : 'default'
                        }>
                            {PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS] || order.priority}
                        </Badge>
                    </div>
                    <p className="text-foreground-secondary mt-1">
                        Creada {formatDate(order.created_at)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <WorkOrderExportButton
                        order={{
                            order_number: order.order_number,
                            status: ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status,
                            priority: PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS] || order.priority,
                            created_at: order.created_at,
                            problem_description: order.problem_description,
                            estimated_cost: order.estimated_cost,
                            device_type: order.device_type || 'Dispositivo',
                            device_brand: order.device_brand,
                            device_model: order.device_model,
                            serial_number: order.device_serial,
                            client: { company_name: order.client.company_name, phone: order.client.phone },
                            technician: order.assigned_user,
                        }}
                    />
                    <Link href={`/dashboard/work-orders/${id}/edit`}>
                        <Button variant="outline">
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Status Actions */}
            <StatusActions orderId={id} currentStatus={order.status} />

            {/* Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Cliente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={`/dashboard/clients/${order.client.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                            {order.client.company_name}
                        </Link>
                        {order.client.phone && (
                            <p className="text-sm text-foreground-secondary mt-1">{order.client.phone}</p>
                        )}
                        {order.client.email && (
                            <p className="text-sm text-foreground-secondary">{order.client.email}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Técnico */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Técnico Asignado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {order.assigned_user ? (
                            <p className="font-medium text-foreground">{order.assigned_user.full_name}</p>
                        ) : (
                            <p className="text-foreground-muted">Sin asignar</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Equipo */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Información del Equipo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div>
                            <p className="text-xs text-foreground-muted">Tipo</p>
                            <p className="text-sm text-foreground">{order.device_type || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-foreground-muted">Marca</p>
                            <p className="text-sm text-foreground">{order.device_brand || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-foreground-muted">Modelo</p>
                            <p className="text-sm text-foreground">{order.device_model || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-foreground-muted">N° Serie</p>
                            <p className="text-sm text-foreground">{order.device_serial || '-'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Problema */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Problema Reportado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                        {order.problem_description}
                    </p>
                </CardContent>
            </Card>

            {/* Diagnóstico */}
            {order.diagnosis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Diagnóstico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                            {order.diagnosis}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Costos */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Costos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-foreground-muted">Costo Estimado</p>
                            <p className="text-lg font-semibold text-foreground">
                                {order.estimated_cost ? formatCurrency(order.estimated_cost) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-foreground-muted">Costo Final</p>
                            <p className="text-lg font-semibold text-foreground">
                                {order.final_cost ? formatCurrency(order.final_cost) : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Historial
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <p className="text-sm">
                                <span className="text-foreground">Recibido:</span>{' '}
                                <span className="text-foreground-secondary">{formatDate(order.received_at)}</span>
                            </p>
                        </div>
                        {order.completed_at && (
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-success" />
                                <p className="text-sm">
                                    <span className="text-foreground">Completado:</span>{' '}
                                    <span className="text-foreground-secondary">{formatDate(order.completed_at)}</span>
                                </p>
                            </div>
                        )}
                        {order.delivered_at && (
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-success" />
                                <p className="text-sm">
                                    <span className="text-foreground">Entregado:</span>{' '}
                                    <span className="text-foreground-secondary">{formatDate(order.delivered_at)}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                <Link href={`/dashboard/work-orders/${id}/report`}>
                    <Button variant="outline">
                        Crear Informe Técnico
                    </Button>
                </Link>
                <Link href={`/dashboard/invoices/new?work_order=${id}`}>
                    <Button>
                        Generar Factura
                    </Button>
                </Link>
            </div>
        </div>
    )
}
