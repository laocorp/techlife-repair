'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface OrdersChartProps {
    data: {
        status: string
        count: number
        color: string
    }[]
}

export function OrdersChart({ data }: OrdersChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="status"
                    tick={{ fill: 'hsl(var(--foreground-secondary))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                    tick={{ fill: 'hsl(var(--foreground-secondary))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                    }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Órdenes">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
