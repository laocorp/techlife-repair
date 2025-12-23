'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Search,
    Plus,
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    Eye,
    RefreshCw,
    Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrdenServicio {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string
    equipo_modelo: string | null
    equipo_serie: string | null
    problema_reportado: string | null
    estado: string
    prioridad: string
    created_at: string
    cliente: {
        id: string
        nombre: string
        telefono: string | null
    } | null
    tecnico: {
        id: string
        nombre: string
    } | null
}

const estadoConfig: Record<string, { label: string; color: string; icon: any }> = {
    recibido: { label: 'Recibido', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Search },
    cotizado: { label: 'Cotizado', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Wrench },
    terminado: { label: 'Terminado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
}

const prioridadConfig: Record<string, { label: string; color: string }> = {
    baja: { label: 'Baja', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    normal: { label: 'Normal', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    alta: { label: 'Alta', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    urgente: { label: 'Urgente', color: 'bg-red-50 text-red-600 border-red-200' },
}

export default function OrdenesPage() {
    const { user } = useAuthStore()
    const [ordenes, setOrdenes] = useState<OrdenServicio[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterEstado, setFilterEstado] = useState<string>('all')

    const loadOrdenes = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/ordenes?empresa_id=${user.empresa_id}`)

            if (!response.ok) {
                throw new Error('Error al cargar órdenes')
            }

            const data = await response.json()
            setOrdenes(data || [])
        } catch (error: any) {
            toast.error('Error al cargar órdenes', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadOrdenes()
    }, [loadOrdenes])

    // Filter orders
    const filteredOrdenes = ordenes.filter(orden => {
        const matchesSearch =
            orden.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
            orden.equipo_tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            orden.equipo_marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
            orden.cliente?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (orden.equipo_serie && orden.equipo_serie.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesEstado = filterEstado === 'all' || orden.estado === filterEstado

        return matchesSearch && matchesEstado
    })

    // Stats
    const stats = {
        total: ordenes.length,
        activas: ordenes.filter(o => !['entregado'].includes(o.estado)).length,
        urgentes: ordenes.filter(o => o.prioridad === 'urgente' && o.estado !== 'entregado').length,
        completadas: ordenes.filter(o => o.estado === 'entregado').length,
    }

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
                        Órdenes de Servicio
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestiona las reparaciones y servicios técnicos</p>
                </div>
                <PermissionGate permission="orders.create">
                    <Link href="/ordenes/nueva">
                        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 border-0">
                            <Plus className="h-4 w-4" />
                            Nueva Orden
                        </Button>
                    </Link>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/40 backdrop-blur-md border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm font-medium">Total</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/40 backdrop-blur-md border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm font-medium">Activas</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.activas}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/40 backdrop-blur-md border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm font-medium">Urgentes</p>
                        <p className="text-3xl font-bold text-red-500">{stats.urgentes}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/40 backdrop-blur-md border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm font-medium">Completadas</p>
                        <p className="text-3xl font-bold text-emerald-600">{stats.completadas}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table Container */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden">
                <CardContent className="p-6 space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por orden, equipo, cliente o serie..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/50 border-gray-200 focus:bg-white focus:ring-blue-500/20 transition-all placeholder:text-muted-foreground/70"
                            />
                        </div>
                        <Select value={filterEstado} onValueChange={setFilterEstado}>
                            <SelectTrigger className="w-[200px] bg-white/50 border-gray-200">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                {Object.entries(estadoConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                                            {config.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadOrdenes}
                            className="bg-white/50 border-gray-200 hover:bg-white hover:text-blue-600"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Orders Table */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-gray-100/50" />
                            ))}
                        </div>
                    ) : filteredOrdenes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Wrench className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No se encontraron órdenes</h3>
                            <p className="text-muted-foreground mt-1 mb-6 max-w-sm">
                                No hay órdenes que coincidan con tu búsqueda o filtros actuales.
                            </p>
                            <PermissionGate permission="orders.create">
                                <Link href="/ordenes/nueva">
                                    <Button variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Crear primera orden
                                    </Button>
                                </Link>
                            </PermissionGate>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-gray-100 hover:bg-transparent">
                                        <TableHead className="font-semibold text-gray-600">Orden</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Cliente / Equipo</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Prioridad</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Técnico</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Fecha</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrdenes.map((orden) => {
                                        const estado = estadoConfig[orden.estado] || estadoConfig.recibido
                                        const prioridad = prioridadConfig[orden.prioridad] || prioridadConfig.normal
                                        const EstadoIcon = estado.icon

                                        return (
                                            <TableRow key={orden.id} className="border-gray-100 hover:bg-blue-50/30 transition-colors group">
                                                <TableCell>
                                                    <span className="font-mono font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                                        {orden.numero}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{orden.cliente?.nombre || 'Sin cliente'}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <span className="font-medium text-gray-700">{orden.equipo_tipo}</span>
                                                            {orden.equipo_marca && <span className="text-gray-400">· {orden.equipo_marca}</span>}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`${estado.color} gap-1.5 px-2.5 py-0.5 border`}>
                                                        <EstadoIcon className="h-3 w-3" />
                                                        {estado.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`${prioridad.color} font-normal border`}>
                                                        {prioridad.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {orden.tecnico ? (
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                                {orden.tecnico.nombre.charAt(0)}
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300" />
                                                        )}
                                                        <span className="text-sm text-gray-600">{orden.tecnico?.nombre || 'Sin asignar'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(orden.created_at), 'dd MMM yyyy', { locale: es })}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/ordenes/${orden.id}`}>
                                                        <Button variant="ghost" size="sm" className="hover:bg-blue-100 hover:text-blue-700 text-gray-500">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Ver
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
