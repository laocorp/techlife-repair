import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent } from '@/components/ui'
import { Plus, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { hasModuleAccess } from '@/lib/plans'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Facturas',
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    paid: 'Pagada',
    partial: 'Pago parcial',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    draft: 'default',
    sent: 'info',
    paid: 'success',
    partial: 'warning',
    overdue: 'error',
    cancelled: 'default',
}

interface Invoice {
    id: string
    invoice_number: string
    status: string
    total: number
    due_date: string | null
    created_at: string
    client: {
        id: string
        company_name: string
    }
}

async function getInvoices(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select(`
      id, invoice_number, status, total, due_date, created_at,
      client:clients(id, company_name)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return (data || []).map(i => ({
        ...i,
        client: i.client as unknown as { id: string; company_name: string },
    }))
}

export default async function InvoicesPage() {
    if (!await hasModuleAccess('invoices')) {
        redirect('/dashboard')
    }
    const supabase = await createClient()
    const invoices = await getInvoices(supabase)

    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const totalPending = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
    const draftCount = invoices.filter(i => i.status === 'draft').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Facturas</h1>
                    <p className="text-foreground-secondary">Gestiona tus facturas</p>
                </div>
                <Link href="/dashboard/invoices/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nueva Factura
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{invoices.length}</p>
                                <p className="text-sm text-foreground-secondary">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(totalPaid)}</p>
                                <p className="text-sm text-foreground-secondary">Cobrado</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(totalPending)}</p>
                                <p className="text-sm text-foreground-secondary">Pendiente</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{draftCount}</p>
                                <p className="text-sm text-foreground-secondary">Borradores</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No hay facturas</h3>
                    <p className="text-foreground-secondary text-center mb-4">Crea tu primera factura</p>
                    <Link href="/dashboard/invoices/new">
                        <Button><Plus className="h-4 w-4" />Nueva Factura</Button>
                    </Link>
                </div>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-background-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Número</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-secondary uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-background-secondary/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/dashboard/invoices/${invoice.id}`}
                                            className="font-medium text-foreground hover:text-primary transition-colors"
                                        >
                                            {invoice.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground-secondary">
                                        {invoice.client.company_name}
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant={STATUS_VARIANTS[invoice.status] || 'default'}>
                                            {STATUS_LABELS[invoice.status] || invoice.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground text-right font-medium">
                                        {formatCurrency(invoice.total)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground-secondary">
                                        {formatDate(invoice.created_at)}
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
