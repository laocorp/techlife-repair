import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { PaymentForm } from './payment-form'

export const metadata = {
    title: 'Registrar Pago',
}

interface Invoice {
    id: string
    invoice_number: string
    total: number
    total_paid: number
    client: {
        company_name: string
    }
}

async function getPendingInvoices(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Invoice[]> {
    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
      id, invoice_number, total,
      client:clients(company_name)
    `)
        .in('status', ['sent', 'partial', 'overdue'])
        .order('created_at', { ascending: false })

    if (!invoices) return []

    // Get payments for each invoice
    const invoiceIds = invoices.map(i => i.id)
    const { data: payments } = await supabase
        .from('payments')
        .select('invoice_id, amount')
        .in('invoice_id', invoiceIds)

    const paymentsByInvoice: Record<string, number> = {}
    payments?.forEach(p => {
        paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + p.amount
    })

    return invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: inv.total,
        total_paid: paymentsByInvoice[inv.id] || 0,
        client: inv.client as unknown as { company_name: string },
    }))
}

export default async function NewPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ invoice?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const invoices = await getPendingInvoices(supabase)

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/payments"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Pagos
                </Link>
            </div>

            <PaymentForm
                invoices={invoices}
                defaultInvoiceId={params.invoice}
            />
        </div>
    )
}
