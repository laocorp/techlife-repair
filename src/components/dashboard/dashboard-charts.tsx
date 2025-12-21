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

// Sample chart data
const revenueData = [
    { name: 'Lun', value: 1200 },
    { name: 'Mar', value: 1800 },
    { name: 'Mié', value: 1400 },
    { name: 'Jue', value: 2200 },
    { name: 'Vie', value: 1900 },
    { name: 'Sáb', value: 2800 },
    { name: 'Dom', value: 2100 },
]

const ordersData = [
    { name: 'Lun', ordenes: 8 },
    { name: 'Mar', ordenes: 12 },
    { name: 'Mié', ordenes: 9 },
    { name: 'Jue', ordenes: 15 },
    { name: 'Vie', ordenes: 11 },
    { name: 'Sáb', ordenes: 18 },
    { name: 'Dom', ordenes: 14 },
]

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
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
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
                        <p className="text-xs text-emerald-600">+23% vs semana pasada</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueData}>
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
                            tickFormatter={(value) => `$${value}`}
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
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
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
                    <BarChart data={ordersData}>
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
                        />
                        <Bar
                            dataKey="ordenes"
                            fill="#0f172a"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
