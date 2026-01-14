import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export const metadata = {
    title: 'Pagos - Super Admin',
}

interface Transaction {
    id: string
    tenant_id: string
    plan_id: string
    amount: number
    provider: string
    provider_transaction_id: string | null
    client_transaction_id: string
    status: string
    created_at: string
    tenant: {
        name: string
        slug: string
    } | null
    plan: {
        name: string
    } | null
}

async function getTransactions(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Transaction[]> {
    const { data: transactions } = await supabase
        .from('transactions')
        .select(`
            id, tenant_id, plan_id, amount, provider, provider_transaction_id, 
            client_transaction_id, status, created_at,
            tenant:tenants(name, slug),
            plan:plans(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (!transactions) return []

    return transactions.map(t => ({
        ...t,
        tenant: t.tenant as unknown as { name: string; slug: string } | null,
        plan: t.plan as unknown as { name: string } | null,
    }))
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    completed: 'success',
    approved: 'success',
    pending: 'warning',
    failed: 'error',
    cancelled: 'default',
}

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
    completed: CheckCircle,
    approved: CheckCircle,
    pending: Clock,
    failed: XCircle,
    cancelled: XCircle,
}

export default async function PaymentsPage() {
    const supabase = await createClient()
    const transactions = await getTransactions(supabase)

    const totalRevenue = transactions
        .filter(t => t.status === 'completed' || t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0) / 100

    const pendingPayments = transactions.filter(t => t.status === 'pending').length
    const failedPayments = transactions.filter(t => t.status === 'failed').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Registro de Transacciones</h2>
                <p className="text-foreground-secondary">Historial completo de pagos del sistema</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-success">{formatCurrency(totalRevenue)}</p>
                            <p className="text-sm text-foreground-secondary">Ingresos Totales</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-warning">{pendingPayments}</p>
                            <p className="text-sm text-foreground-secondary">Pagos Pendientes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-error">{failedPayments}</p>
                            <p className="text-sm text-foreground-secondary">Pagos Fallidos</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Últimas 100 Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <p className="text-center text-foreground-muted py-8">No hay transacciones</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-background-secondary">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Fecha</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Empresa</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Plan</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Proveedor</th>
                                        <th className="px-3 py-2 text-right font-medium text-foreground-secondary">Monto</th>
                                        <th className="px-3 py-2 text-center font-medium text-foreground-secondary">Estado</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">ID Transacción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transactions.map((tx) => {
                                        const Icon = STATUS_ICONS[tx.status] || Clock
                                        return (
                                            <tr key={tx.id} className="hover:bg-background-secondary/50">
                                                <td className="px-3 py-3 text-foreground-secondary">
                                                    {formatDate(tx.created_at)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {tx.tenant ? (
                                                        <div>
                                                            <p className="font-medium text-foreground">{tx.tenant.name}</p>
                                                            <p className="text-xs text-foreground-muted">{tx.tenant.slug}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-foreground-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-foreground-secondary">
                                                    {tx.plan?.name || '-'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="px-2 py-1 bg-background-secondary rounded text-xs font-medium">
                                                        {tx.provider}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right font-medium">
                                                    {formatCurrency(tx.amount / 100)}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <Badge variant={STATUS_VARIANTS[tx.status] || 'default'} className="gap-1">
                                                        <Icon className="h-3 w-3" />
                                                        {tx.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-foreground-muted font-mono text-xs">
                                                    {tx.provider_transaction_id || tx.client_transaction_id}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
