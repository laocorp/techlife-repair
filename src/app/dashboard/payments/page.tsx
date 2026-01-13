import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent } from '@/components/ui'
import { Plus, DollarSign, CreditCard, Banknote, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = {
    title: 'Pagos',
}

const METHOD_LABELS: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    check: 'Cheque',
    other: 'Otro',
}

const METHOD_ICONS: Record<string, typeof Banknote> = {
    cash: Banknote,
    transfer: DollarSign,
    card: CreditCard,
    check: DollarSign,
    other: DollarSign,
}

interface Payment {
    id: string
    amount: number
    payment_method: string
    reference: string | null
    payment_date: string
    created_at: string
    invoice: {
        id: string
        invoice_number: string
        client: {
            company_name: string
        }
    }
}

async function getPayments(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Payment[]> {
    const { data, error } = await supabase
        .from('payments')
        .select(`
      id, amount, payment_method, reference, payment_date, created_at,
      invoice:invoices(
        id, invoice_number,
        client:clients(company_name)
      )
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error fetching payments:', error)
        return []
    }

    return (data || []).map(p => ({
        ...p,
        invoice: {
            id: (p.invoice as { id: string }).id,
            invoice_number: (p.invoice as { invoice_number: string }).invoice_number,
            client: (p.invoice as { client: { company_name: string } }).client,
        },
    }))
}

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, payment_date')

    const todayTotal = allPayments?.filter(p => p.payment_date === today).reduce((s, p) => s + p.amount, 0) || 0
    const monthTotal = allPayments?.filter(p => p.payment_date >= monthStart).reduce((s, p) => s + p.amount, 0) || 0
    const totalCount = allPayments?.length || 0

    return { todayTotal, monthTotal, totalCount }
}

export default async function PaymentsPage() {
    const supabase = await createClient()
    const [payments, stats] = await Promise.all([
        getPayments(supabase),
        getStats(supabase),
    ])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pagos</h1>
                    <p className="text-foreground-secondary">Historial de pagos recibidos</p>
                </div>
                <Link href="/dashboard/payments/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Registrar Pago
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(stats.todayTotal)}</p>
                                <p className="text-sm text-foreground-secondary">Hoy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(stats.monthTotal)}</p>
                                <p className="text-sm text-foreground-secondary">Este mes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{stats.totalCount}</p>
                                <p className="text-sm text-foreground-secondary">Total pagos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <DollarSign className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No hay pagos</h3>
                    <p className="text-foreground-secondary text-center mb-4">Registra tu primer pago</p>
                    <Link href="/dashboard/payments/new">
                        <Button><Plus className="h-4 w-4" />Registrar Pago</Button>
                    </Link>
                </div>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-background-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Factura</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">Método</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-secondary uppercase">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {payments.map((payment) => {
                                const Icon = METHOD_ICONS[payment.payment_method] || DollarSign
                                return (
                                    <tr key={payment.id} className="hover:bg-background-secondary/50 transition-colors">
                                        <td className="px-4 py-4 text-sm text-foreground">
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Link
                                                href={`/dashboard/invoices/${payment.invoice.id}`}
                                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                            >
                                                {payment.invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground-secondary">
                                            {payment.invoice.client.company_name}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-foreground-muted" />
                                                <span className="text-sm">{METHOD_LABELS[payment.payment_method]}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground text-right font-medium">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
