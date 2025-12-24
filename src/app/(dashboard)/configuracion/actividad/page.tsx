'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Activity,
    RefreshCw,
    User,
    Calendar,
    Filter,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Plus,
    Edit,
    Trash2,
    LogIn,
    LogOut,
    Eye,
    Download,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityLogEntry {
    id: string
    accion: string
    modulo: string
    entidad_id: string | null
    detalles: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    usuario: {
        id: string
        nombre: string
        email: string
    } | null
}

// Action icons and colors
const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    create: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    update: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-100' },
    delete: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
    login: { icon: LogIn, color: 'text-purple-600', bg: 'bg-purple-100' },
    logout: { icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-100' },
    view: { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' },
    export: { icon: Download, color: 'text-indigo-600', bg: 'bg-indigo-100' },
}

// Module display names
const moduleNames: Record<string, string> = {
    orders: 'Órdenes',
    inventory: 'Inventario',
    clients: 'Clientes',
    users: 'Usuarios',
    roles: 'Roles',
    cash: 'Caja',
    invoices: 'Facturación',
    sales: 'Ventas',
    settings: 'Configuración',
    auth: 'Autenticación',
}

// Action display names
const actionNames: Record<string, string> = {
    create: 'Creación',
    update: 'Actualización',
    delete: 'Eliminación',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    view: 'Visualización',
    export: 'Exportación',
}

export default function ActividadPage() {
    const { user } = useAuthStore()
    const [logs, setLogs] = useState<ActivityLogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0)
    const limit = 20

    // Filters
    const [filterModulo, setFilterModulo] = useState<string>('all')
    const [filterAccion, setFilterAccion] = useState<string>('all')
    const [filterFechaDesde, setFilterFechaDesde] = useState('')
    const [filterFechaHasta, setFilterFechaHasta] = useState('')

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                empresa_id: user.empresa_id,
                limit: limit.toString(),
                offset: offset.toString(),
            })

            if (filterModulo && filterModulo !== 'all') {
                params.append('modulo', filterModulo)
            }
            if (filterAccion && filterAccion !== 'all') {
                params.append('accion', filterAccion)
            }
            if (filterFechaDesde) {
                params.append('fecha_desde', filterFechaDesde)
            }
            if (filterFechaHasta) {
                params.append('fecha_hasta', filterFechaHasta)
            }

            const response = await fetch(`/api/activity-logs?${params}`)
            if (!response.ok) throw new Error('Error al cargar registros')

            const data = await response.json()
            setLogs(data.logs || [])
            setTotal(data.total || 0)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            toast.error('Error', { description: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id, offset, filterModulo, filterAccion, filterFechaDesde, filterFechaHasta])

    useEffect(() => {
        loadData()
    }, [loadData])

    const resetFilters = () => {
        setFilterModulo('all')
        setFilterAccion('all')
        setFilterFechaDesde('')
        setFilterFechaHasta('')
        setOffset(0)
    }

    const getActionDisplay = (accion: string) => {
        const config = actionConfig[accion] || actionConfig.view
        const Icon = config.icon
        return (
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
        )
    }

    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Registro de Actividad
                    </h1>
                    <p className="text-muted-foreground mt-1">Historial de acciones realizadas en el sistema</p>
                </div>
                <Button
                    variant="outline"
                    onClick={loadData}
                    className="bg-white border-gray-200 hover:bg-gray-50 gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Total Registros</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Activity className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Módulo</label>
                            <Select value={filterModulo} onValueChange={setFilterModulo}>
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {Object.entries(moduleNames).map(([key, name]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Acción</label>
                            <Select value={filterAccion} onValueChange={setFilterAccion}>
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {Object.entries(actionNames).map(([key, name]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Desde</label>
                            <Input
                                type="date"
                                value={filterFechaDesde}
                                onChange={(e) => setFilterFechaDesde(e.target.value)}
                                className="bg-white border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Hasta</label>
                            <Input
                                type="date"
                                value={filterFechaHasta}
                                onChange={(e) => setFilterFechaHasta(e.target.value)}
                                className="bg-white border-gray-200"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" onClick={resetFilters} className="w-full bg-white border-gray-200">
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full bg-gray-100" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No hay registros</h3>
                            <p className="text-muted-foreground mt-1">No se encontraron actividades con los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {getActionDisplay(log.accion)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-gray-900">
                                                    {log.usuario?.nombre || 'Sistema'}
                                                </span>
                                                <span className="text-gray-500">realizó</span>
                                                <Badge variant="outline" className="border-gray-200">
                                                    {actionNames[log.accion] || log.accion}
                                                </Badge>
                                                <span className="text-gray-500">en</span>
                                                <Badge className="bg-blue-100 text-blue-700 border-0">
                                                    {moduleNames[log.modulo] || log.modulo}
                                                </Badge>
                                                {log.entidad_id && (
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        #{log.entidad_id.slice(0, 8)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(log.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                                </span>
                                                <span className="text-gray-400">
                                                    ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })})
                                                </span>
                                                {log.ip_address && (
                                                    <span className="text-xs font-mono">IP: {log.ip_address}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOffset(Math.max(0, offset - limit))}
                                    disabled={offset === 0}
                                    className="bg-white border-gray-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <span className="text-sm text-muted-foreground px-2">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOffset(offset + limit)}
                                    disabled={offset + limit >= total}
                                    className="bg-white border-gray-200"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
