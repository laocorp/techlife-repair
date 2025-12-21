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

// Sample chart data - moved from page.tsx
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
        transition: { duration: 0.4, ease: "easeOut" }
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
            <div className="chart-container">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Ingresos de la Semana</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Últimos 7 días</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">${((stats?.ventas_mes || 0)).toFixed(0)}</p>
                        <p className="text-xs text-emerald-400">+23% vs semana pasada</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(185, 85%, 50%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(185, 85%, 50%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 12%)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(220, 10%, 40%)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(220, 10%, 40%)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(220, 15%, 10%)',
                                border: '1px solid hsl(220, 15%, 16%)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(185, 85%, 50%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div className="chart-container">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Órdenes por Día</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Últimos 7 días</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-white">{stats?.ordenes_hoy || 0}</p>
                        <p className="text-xs text-zinc-500">órdenes hoy</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ordersData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 12%)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(220, 10%, 40%)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(220, 10%, 40%)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(220, 15%, 10%)',
                                border: '1px solid hsl(220, 15%, 16%)',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                        />
                        <Bar
                            dataKey="ordenes"
                            fill="hsl(262, 83%, 58%)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}
