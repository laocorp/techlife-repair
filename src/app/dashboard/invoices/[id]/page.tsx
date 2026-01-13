import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Trash2, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceLines } from './invoice-lines'
import { InvoiceStatusActions } from './invoice-status-actions'

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

interface InvoiceDetailPageProps {
    params: Promise<{ id: string }>
}

interface Invoice {
    id: string
    invoice_number: string
    status: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    discount: number
    total: number
    notes: string | null
    due_date: string | null
    paid_at: string | null
    created_at: string
    client: {
        id: string
        company_name: string
        email: string | null
    }
    work_order: {
        id: string
        order_number: string
    } | null
}

interface InvoiceLine {
    id: string
    description: string
    quantity: number
    unit_price: number
    discount: number
    total: number
    product: {
        id: string
        name: string
    } | null
}

interface Product {
    id: string
    name: string
    unit_price: number
}

async function getInvoice(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
        .from('invoices')
        .select(`
      *,
      client:clients(id, company_name, email),
      work_order:work_orders(id, order_number)
    `)
        .eq('id', id)
        .single()

    if (error) return null

    return {
        ...data,
        client: data.client as unknown as Invoice['client'],
        work_order: data.work_order as unknown as Invoice['work_order'],
    }
}

async function getInvoiceLines(supabase: Awaited<ReturnType<typeof createClient>>, invoiceId: string): Promise<InvoiceLine[]> {
    const { data } = await supabase
        .from('invoice_lines')
        .select(`
      id, description, quantity, unit_price, discount, total,
      product:products(id, name)
    `)
        .eq('invoice_id', invoiceId)
        .order('created_at')

    return (data || []).map(l => ({
        ...l,
        product: l.product as unknown as { id: string; name: string } | null,
    }))
}

async function getProducts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Product[]> {
    const { data } = await supabase
        .from('products')
        .select('id, name, unit_price')
        .eq('is_active', true)
        .order('name')
    return (data || []) as Product[]
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const [invoice, lines, products] = await Promise.all([
        getInvoice(supabase, id),
        getInvoiceLines(supabase, id),
        getProducts(supabase),
    ])

    if (!invoice) notFound()

    const isDraft = invoice.status === 'draft'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/invoices"
                className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver a Facturas
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-foreground">
                            {invoice.invoice_number}
                        </h1>
                        <Badge variant={STATUS_VARIANTS[invoice.status]}>
                            {STATUS_LABELS[invoice.status]}
                        </Badge>
                    </div>
                    <p className="text-foreground-secondary mt-1">
                        {invoice.client.company_name}
                    </p>
                </div>
            </div>

            {/* Status Actions */}
            <InvoiceStatusActions invoiceId={id} currentStatus={invoice.status} />

            {/* Info Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={`/dashboard/clients/${invoice.client.id}`}
                            className="font-medium text-foreground hover:text-primary"
                        >
                            {invoice.client.company_name}
                        </Link>
                        {invoice.client.email && (
                            <p className="text-sm text-foreground-secondary">{invoice.client.email}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-foreground-secondary">Fecha:</span>
                            <span>{formatDate(invoice.created_at)}</span>
                        </div>
                        {invoice.due_date && (
                            <div className="flex justify-between">
                                <span className="text-foreground-secondary">Vencimiento:</span>
                                <span>{formatDate(invoice.due_date)}</span>
                            </div>
                        )}
                        {invoice.work_order && (
                            <div className="flex justify-between">
                                <span className="text-foreground-secondary">Orden:</span>
                                <Link href={`/dashboard/work-orders/${invoice.work_order.id}`} className="text-primary hover:underline">
                                    {invoice.work_order.order_number}
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Lines */}
            <InvoiceLines
                invoiceId={id}
                lines={lines}
                products={products}
                editable={isDraft}
            />

            {/* Totals */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2 text-sm max-w-xs ml-auto">
                        <div className="flex justify-between">
                            <span className="text-foreground-secondary">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-foreground-secondary">IVA ({invoice.tax_rate}%):</span>
                            <span>{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                        {invoice.discount > 0 && (
                            <div className="flex justify-between text-error">
                                <span>Descuento:</span>
                                <span>-{formatCurrency(invoice.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                            <span>Total:</span>
                            <span>{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{invoice.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
