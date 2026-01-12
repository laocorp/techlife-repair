import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DeleteClientButton } from './delete-button'
import type { Client } from '@/types/database'

interface ClientPageProps {
    params: Promise<{ id: string }>
}

async function getClient(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<Client | null> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return data as Client
}

async function getClientStats(supabase: Awaited<ReturnType<typeof createClient>>, clientId: string) {
    const [workOrdersResult, invoicesResult] = await Promise.all([
        supabase
            .from('work_orders')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
        supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),
    ])

    return {
        workOrders: workOrdersResult.count || 0,
        invoices: invoicesResult.count || 0,
    }
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const client = await getClient(supabase, id)

    if (!client) {
        notFound()
    }

    const stats = await getClientStats(supabase, id)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back button */}
            <Link
                href="/dashboard/clients"
                className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a Clientes
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {client.company_name}
                    </h1>
                    {client.tax_id && (
                        <Badge variant="default" className="mt-2">
                            RUC: {client.tax_id}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/clients/${id}/edit`}>
                        <Button variant="outline">
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                    <DeleteClientButton id={id} name={client.company_name} />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-semibold text-foreground">{stats.workOrders}</div>
                        <div className="text-sm text-foreground-secondary">Órdenes de Trabajo</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-semibold text-foreground">{stats.invoices}</div>
                        <div className="text-sm text-foreground-secondary">Facturas</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-semibold text-foreground">
                            {formatDate(client.created_at)}
                        </div>
                        <div className="text-sm text-foreground-secondary">Cliente desde</div>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {client.email && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-background-secondary flex items-center justify-center">
                                <Mail className="h-4 w-4 text-foreground-secondary" />
                            </div>
                            <div>
                                <div className="text-xs text-foreground-muted">Email</div>
                                <a href={`mailto:${client.email}`} className="text-sm text-foreground hover:text-primary">
                                    {client.email}
                                </a>
                            </div>
                        </div>
                    )}

                    {client.phone && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-background-secondary flex items-center justify-center">
                                <Phone className="h-4 w-4 text-foreground-secondary" />
                            </div>
                            <div>
                                <div className="text-xs text-foreground-muted">Teléfono</div>
                                <a href={`tel:${client.phone}`} className="text-sm text-foreground hover:text-primary">
                                    {client.phone}
                                </a>
                            </div>
                        </div>
                    )}

                    {client.address && (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-background-secondary flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-foreground-secondary" />
                            </div>
                            <div>
                                <div className="text-xs text-foreground-muted">Dirección</div>
                                <div className="text-sm text-foreground">{client.address}</div>
                            </div>
                        </div>
                    )}

                    {!client.email && !client.phone && !client.address && (
                        <p className="text-sm text-foreground-muted">
                            No hay información de contacto registrada.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Notes */}
            {client.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Notas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                            {client.notes}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Link href={`/dashboard/work-orders/new?client=${id}`}>
                    <Button>
                        Crear Orden de Trabajo
                    </Button>
                </Link>
                <Link href={`/dashboard/invoices/new?client=${id}`}>
                    <Button variant="outline">
                        Crear Factura
                    </Button>
                </Link>
            </div>
        </div>
    )
}
