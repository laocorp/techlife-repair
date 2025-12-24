'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
    Activity,
    Search,
    RefreshCw,
    Loader2,
    ArrowLeft,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    LogIn,
    Plus,
    Settings,
    FileText,
    Package,
    Users,
    Building2,
    ShoppingCart,
    CreditCard,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface ActivityLog {
    id: string
    accion: string
    modulo: string
    entidad_id: string | null
    detalles: any
    ip_address: string | null
    user_agent: string | null
    created_at: string
    usuario: {
        id: string
        nombre: string
        email: string
        rol: string
    } | null
    empresa: {
        id: string
        nombre: string
    } | null
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

const accionIcons: Record<string, any> = {
    'create': Plus,
    'update': Edit,
    'delete': Trash2,
    'view': Eye,
    'login': LogIn,
    'impersonate': Eye,
}

const accionColors: Record<string, string> = {
    'create': 'bg-emerald-100 text-emerald-700',
    'update': 'bg-blue-100 text-blue-700',
    'delete': 'bg-red-100 text-red-700',
    'view': 'bg-slate-100 text-slate-700',
    'login': 'bg-purple-100 text-purple-700',
    'impersonate': 'bg-amber-100 text-amber-700',
}

const moduloIcons: Record<string, any> = {
    'ordenes': Package,
    'clientes': Users,
    'productos': ShoppingCart,
    'ventas': CreditCard,
    'usuarios': Users,
    'configuracion': Settings,
    'empresas': Building2,
    'superadmin': Activity,
    'facturacion': FileText,
}

export default function LogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterModulo, setFilterModulo] = useState<string>('all')
    const [filterAccion, setFilterAccion] = useState<string>('all')

    const modulos = [
        'ordenes', 'clientes', 'productos', 'ventas',
        'usuarios', 'configuracion', 'empresas', 'superadmin', 'facturacion'
    ]

    const acciones = ['create', 'update', 'delete', 'view', 'login', 'impersonate']

    const loadLogs = useCallback(async (page = 1) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
            })

            if (filterModulo !== 'all') params.append('modulo', filterModulo)
            if (filterAccion !== 'all') params.append('accion', filterAccion)

            const response = await fetch(`/api/superadmin/logs?${params}`)
            if (!response.ok) throw new Error('Error loading logs')

            const data = await response.json()
            setLogs(data.logs || [])
            setPagination(data.pagination)
        } catch (error: any) {
            toast.error('Error al cargar logs', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [filterModulo, filterAccion])

    useEffect(() => {
        loadLogs()
    }, [loadLogs])

    const getAccionBadge = (accion: string) => {
        const Icon = accionIcons[accion] || Activity
        const color = accionColors[accion] || 'bg-slate-100 text-slate-700'
        return (
            <Badge variant="outline" className={`gap-1 font-medium ${color}`}>
                <Icon className="w-3 h-3" />
                {accion}
            </Badge>
        )
    }

    const getModuloBadge = (modulo: string) => {
        const Icon = moduloIcons[modulo] || Package
        return (
            <Badge variant="secondary" className="gap-1 font-medium">
                <Icon className="w-3 h-3" />
                {modulo}
            </Badge>
        )
    }

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true
        const searchLower = searchQuery.toLowerCase()
        return (
            log.usuario?.nombre.toLowerCase().includes(searchLower) ||
            log.usuario?.email.toLowerCase().includes(searchLower) ||
            log.empresa?.nombre.toLowerCase().includes(searchLower) ||
            log.modulo.toLowerCase().includes(searchLower)
        )
    })

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
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Logs de Actividad</h1>
                                <p className="text-xs text-slate-500">Auditoría global del sistema</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
                >
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total Logs</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{pagination.total.toLocaleString()}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Página Actual</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{pagination.page} / {pagination.totalPages}</p>
                                </div>
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Filtro Módulo</p>
                                    <p className="text-lg font-bold text-slate-800 mt-1 capitalize">
                                        {filterModulo === 'all' ? 'Todos' : filterModulo}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Filter className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Filtro Acción</p>
                                    <p className="text-lg font-bold text-slate-800 mt-1 capitalize">
                                        {filterAccion === 'all' ? 'Todas' : filterAccion}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logs Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl text-slate-800">Registro de Actividades</CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Historial de acciones en el sistema
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-3 mt-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por usuario, empresa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-slate-200"
                                    />
                                </div>
                                <Select value={filterModulo} onValueChange={setFilterModulo}>
                                    <SelectTrigger className="w-[160px] border-slate-200">
                                        <SelectValue placeholder="Módulo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los módulos</SelectItem>
                                        {modulos.map(m => (
                                            <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterAccion} onValueChange={setFilterAccion}>
                                    <SelectTrigger className="w-[140px] border-slate-200">
                                        <SelectValue placeholder="Acción" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las acciones</SelectItem>
                                        {acciones.map(a => (
                                            <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => loadLogs(pagination.page)}
                                    className="border-slate-200"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                    <TableHead className="text-slate-600 font-semibold">Fecha</TableHead>
                                                    <TableHead className="text-slate-600 font-semibold">Usuario</TableHead>
                                                    <TableHead className="text-slate-600 font-semibold">Empresa</TableHead>
                                                    <TableHead className="text-slate-600 font-semibold">Módulo</TableHead>
                                                    <TableHead className="text-slate-600 font-semibold">Acción</TableHead>
                                                    <TableHead className="text-slate-600 font-semibold">Detalles</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredLogs.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                            No se encontraron registros
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredLogs.map((log) => (
                                                        <TableRow key={log.id} className="hover:bg-slate-50">
                                                            <TableCell className="text-slate-600">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {log.usuario ? (
                                                                    <div>
                                                                        <p className="font-medium text-slate-800">{log.usuario.nombre}</p>
                                                                        <p className="text-sm text-slate-500">{log.usuario.email}</p>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">Sistema</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {log.empresa ? (
                                                                    <Badge variant="outline" className="font-medium">
                                                                        {log.empresa.nombre}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{getModuloBadge(log.modulo)}</TableCell>
                                                            <TableCell>{getAccionBadge(log.accion)}</TableCell>
                                                            <TableCell className="max-w-xs">
                                                                {log.detalles ? (
                                                                    <code className="text-xs bg-slate-100 p-1 rounded text-slate-600 block truncate">
                                                                        {typeof log.detalles === 'string'
                                                                            ? log.detalles
                                                                            : JSON.stringify(log.detalles).slice(0, 50)}
                                                                    </code>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-sm text-slate-500">
                                                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => loadLogs(pagination.page - 1)}
                                                    disabled={pagination.page <= 1}
                                                    className="border-slate-200"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <span className="text-sm font-medium text-slate-700">
                                                    {pagination.page} / {pagination.totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => loadLogs(pagination.page + 1)}
                                                    disabled={pagination.page >= pagination.totalPages}
                                                    className="border-slate-200"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    )
}
