'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts'
import { motion } from 'framer-motion'

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const }
    },
}

interface DashboardChartsProps {
    stats: {
        ventas_mes: number
        ordenes_hoy: number
    } | null
    charts?: {
        name: string
        sales: number
        orders: number
        originalDate?: string
    }[]
}

export default function DashboardCharts({ stats, charts = [] }: DashboardChartsProps) {
    // Reverse charts if needed, API returns desc or asc? API loops today backwards (i--), so [Today, Yesterday...]. 
    // Recharts usually wants Left->Right as Old->New.
    // The API loop was: for (i=6; i>=0; i--) { subDays(today, i) }
    // i=6 -> 6 days ago. i=0 -> Today.
    // So order is [6 days ago, ..., Today]. This is CORRECT for charts (Left to Right).

    // If no data, show empty state or simple placeholder, but parent likely sends correct structure.
    // We can fallback to empty array which renders empty axis.

    return (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">Ingresos de la Semana</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Últimos 7 días</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">${((stats?.ventas_mes || 0)).toFixed(0)}</p>
                        <p className="text-xs text-emerald-600">Total acumulado</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={charts}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: any) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            labelStyle={{ color: '#0f172a' }}
                            formatter={(value: any) => [`$${value}`, 'Ventas']}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#0f172a"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">Órdenes por Día</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Últimos 7 días</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{stats?.ordenes_hoy || 0}</p>
                        <p className="text-xs text-slate-500">órdenes hoy</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={charts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            labelStyle={{ color: '#0f172a' }}
                            formatter={(value: any) => [value, 'Órdenes']}
                        />
                        <Bar
                            dataKey="orders"
                            fill="#0f172a"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
