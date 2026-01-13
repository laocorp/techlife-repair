import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { hasModuleAccess } from '@/lib/plans'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Contabilidad',
}

interface AccountingEntry {
    id: string
    type: string
    category: string
    amount: number
    description: string
    reference: string | null
    entry_date: string
}

async function getEntries(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AccountingEntry[]> {
    const { data } = await supabase
        .from('accounting_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(50)

    return (data || []) as AccountingEntry[]
}

async function getAccountingSummary(
    supabase: Awaited<ReturnType<typeof createClient>>,
    startDate: string,
    endDate: string
) {
    const { data: entries } = await supabase
        .from('accounting_entries')
        .select('type, category, amount')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)

    const income = entries?.filter((e: { type: string; amount: number }) => e.type === 'income').reduce((s, e) => s + e.amount, 0) || 0
    const expenses = entries?.filter((e: { type: string; amount: number }) => e.type === 'expense').reduce((s, e) => s + e.amount, 0) || 0
    const profit = income - expenses

    return { income, expenses, profit }
}

export default async function AccountingPage() {
    if (!await hasModuleAccess('accounting')) {
        redirect('/dashboard')
    }
    const supabase = await createClient()

    // Get current month range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [entries, summary] = await Promise.all([
        getEntries(supabase),
        getAccountingSummary(supabase, startOfMonth, endOfMonth),
    ])

    const monthName = now.toLocaleDateString('es', { month: 'long', year: 'numeric' })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Contabilidad</h1>
                    <p className="text-foreground-secondary capitalize">Resumen de {monthName}</p>
                </div>
                <Link href="/dashboard/accounting/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nuevo Movimiento
                    </Button>
                </Link>
            </div>

            {/* Monthly Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-success">{formatCurrency(summary.income)}</p>
                                <p className="text-sm text-foreground-secondary">Ingresos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-error/10 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-error" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-error">{formatCurrency(summary.expenses)}</p>
                                <p className="text-sm text-foreground-secondary">Gastos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${summary.profit >= 0 ? 'bg-primary/10' : 'bg-warning/10'}`}>
                                <DollarSign className={`h-5 w-5 ${summary.profit >= 0 ? 'text-primary' : 'text-warning'}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-semibold ${summary.profit >= 0 ? 'text-foreground' : 'text-warning'}`}>
                                    {formatCurrency(summary.profit)}
                                </p>
                                <p className="text-sm text-foreground-secondary">Utilidad</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Entries */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Movimientos Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <p className="text-sm text-foreground-muted text-center py-8">
                            No hay movimientos registrados
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-background-secondary"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${entry.type === 'income' ? 'bg-success/10' : 'bg-error/10'
                                            }`}>
                                            {entry.type === 'income'
                                                ? <TrendingUp className="h-4 w-4 text-success" />
                                                : <TrendingDown className="h-4 w-4 text-error" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{entry.description}</p>
                                            <p className="text-xs text-foreground-muted">
                                                {entry.category} • {formatDate(entry.entry_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${entry.type === 'income' ? 'text-success' : 'text-error'
                                        }`}>
                                        {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
