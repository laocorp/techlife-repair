'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { RevenueChart } from '@/components/charts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RevenueData {
    month: string
    revenue: number
    expenses: number
}

interface DashboardChartsProps {
    revenueData: RevenueData[]
    ordersData: { status: string; label: string; count: number; color: string }[]
    totalRevenue: number
    totalExpenses: number
}

export function DashboardCharts({ revenueData, ordersData, totalRevenue, totalExpenses }: DashboardChartsProps) {
    const profit = totalRevenue - totalExpenses

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Ingresos y Gastos (Últimos 6 meses)
                        </CardTitle>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="text-foreground-secondary">Ingresos:</span>
                                <span className="ml-2 font-semibold text-success">{formatCurrency(totalRevenue)}</span>
                            </div>
                            <div>
                                <span className="text-foreground-secondary">Gastos:</span>
                                <span className="ml-2 font-semibold text-error">{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div>
                                <span className="text-foreground-secondary">Utilidad:</span>
                                <span className={`ml-2 font-semibold ${profit >= 0 ? 'text-primary' : 'text-error'}`}>
                                    {formatCurrency(profit)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <RevenueChart data={revenueData} />
                </CardContent>
            </Card>

            {/* Orders by Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Órdenes por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {ordersData.map((item) => (
                            <div key={item.status} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-foreground">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Clients Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Mejores Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground-muted">Basado en facturación total</p>
                </CardContent>
            </Card>
        </div>
    )
}
