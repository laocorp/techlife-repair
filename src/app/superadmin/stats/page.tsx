'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
    ArrowLeft,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Building2,
    Users,
    Package,
    DollarSign,
    RefreshCw,
    Loader2,
    Calendar,
} from 'lucide-react'
import Link from 'next/link'
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
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'

interface StatsData {
    empresasPorMes: { mes: string; total: number }[]
    empresasPorPlan: { plan: string; total: number }[]
    topEmpresas: { nombre: string; ordenes: number; ventas: number }[]
    actividadDiaria: { dia: string; acciones: number }[]
    totales: {
        empresas: number
        usuarios: number
        ordenes: number
        ventas: number
    }
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [periodo, setPeriodo] = useState('6m')

    const loadStats = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/superadmin/stats')
            if (!response.ok) throw new Error('Error cargando estadísticas')
            const data = await response.json()
            setStats(data)
        } catch (error: any) {
            console.error(error)
            toast.error('Error al cargar estadísticas')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium">{title}</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{value.toLocaleString()}</p>
                        {trend && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="font-medium">{trendValue}</span>
                                <span className="text-slate-400">vs mes anterior</span>
                            </div>
                        )}
                    </div>
                    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/superadmin" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Estadísticas</h1>
                                <p className="text-xs text-slate-500">Métricas del sistema</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={periodo} onValueChange={setPeriodo}>
                            <SelectTrigger className="w-[140px] border-slate-200">
                                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Últimos 7 días</SelectItem>
                                <SelectItem value="30d">Últimos 30 días</SelectItem>
                                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                                <SelectItem value="1y">Último año</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadStats}
                            className="border-slate-200"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : stats ? (
                    <>
                        {/* Summary Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                        >
                            <StatCard
                                title="Total Empresas"
                                value={stats.totales.empresas}
                                icon={Building2}
                                trend="up"
                                trendValue="+12%"
                                color="bg-gradient-to-br from-blue-500 to-blue-600"
                            />
                            <StatCard
                                title="Total Usuarios"
                                value={stats.totales.usuarios}
                                icon={Users}
                                trend="up"
                                trendValue="+8%"
                                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                            />
                            <StatCard
                                title="Órdenes Totales"
                                value={stats.totales.ordenes}
                                icon={Package}
                                trend="up"
                                trendValue="+24%"
                                color="bg-gradient-to-br from-purple-500 to-purple-600"
                            />
                            <StatCard
                                title="Ventas Totales"
                                value={stats.totales.ventas}
                                icon={DollarSign}
                                trend="up"
                                trendValue="+18%"
                                color="bg-gradient-to-br from-amber-500 to-amber-600"
                            />
                        </motion.div>

                        {/* Charts Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Crecimiento de Empresas */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="bg-white border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-slate-800">Crecimiento de Empresas</CardTitle>
                                        <CardDescription className="text-slate-500">
                                            Evolución del número de empresas registradas
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.empresasPorMes}>
                                                    <defs>
                                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="total"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorTotal)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Distribución por Plan */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="bg-white border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-slate-800">Distribución por Plan</CardTitle>
                                        <CardDescription className="text-slate-500">
                                            Empresas agrupadas por tipo de suscripción
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.empresasPorPlan}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        fill="#8884d8"
                                                        paddingAngle={5}
                                                        dataKey="total"
                                                        nameKey="plan"
                                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    >
                                                        {stats.empresasPorPlan.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Charts Row 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Actividad Diaria */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="bg-white border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-slate-800">Actividad por Día</CardTitle>
                                        <CardDescription className="text-slate-500">
                                            Acciones registradas en la última semana
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.actividadDiaria}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} />
                                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Bar dataKey="acciones" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Top Empresas */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Card className="bg-white border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-slate-800">Top Empresas por Actividad</CardTitle>
                                        <CardDescription className="text-slate-500">
                                            Empresas con mayor número de órdenes y ventas
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.topEmpresas} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                                                    <YAxis dataKey="nombre" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="ordenes" fill="#3b82f6" name="Órdenes" radius={[0, 4, 4, 0]} />
                                                    <Bar dataKey="ventas" fill="#10b981" name="Ventas" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-24 text-slate-500">
                        No hay datos disponibles
                    </div>
                )}
            </main>
        </div>
    )
}
