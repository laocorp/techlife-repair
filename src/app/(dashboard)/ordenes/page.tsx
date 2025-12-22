'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    Filter,
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    Eye,
    MoreHorizontal,
    Phone,
    RefreshCw,
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
    recibido: { label: 'Recibido', color: 'bg-slate-500', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'bg-blue-500', icon: Search },
    cotizado: { label: 'Cotizado', color: 'bg-amber-500', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'bg-cyan-500', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'bg-violet-500', icon: Wrench },
    terminado: { label: 'Terminado', color: 'bg-emerald-500', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'bg-green-500', icon: CheckCircle },
}

const prioridadConfig: Record<string, { label: string; color: string }> = {
    baja: { label: 'Baja', color: 'border-slate-500 text-slate-400' },
    normal: { label: 'Normal', color: 'border-blue-500 text-blue-400' },
    alta: { label: 'Alta', color: 'border-amber-500 text-amber-400' },
    urgente: { label: 'Urgente', color: 'border-red-500 text-red-400' },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Órdenes de Servicio</h1>
                    <p className="text-slate-400 mt-1">Gestiona las reparaciones y servicios técnicos</p>
                </div>
                <PermissionGate permission="orders.create">
                    <Link href="/ordenes/nueva">
                        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                            <Plus className="h-4 w-4" />
                            Nueva Orden
                        </Button>
                    </Link>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-slate-400 text-sm">Total</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-slate-400 text-sm">Activas</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.activas}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-slate-400 text-sm">Urgentes</p>
                        <p className="text-2xl font-bold text-red-400">{stats.urgentes}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-slate-400 text-sm">Completadas</p>
                        <p className="text-2xl font-bold text-emerald-400">{stats.completadas}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por orden, equipo, cliente o serie..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Select value={filterEstado} onValueChange={setFilterEstado}>
                            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="all" className="text-white">Todos los estados</SelectItem>
                                {Object.entries(estadoConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key} className="text-white">
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadOrdenes}
                            className="border-white/10 text-slate-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-white/10" />
                            ))}
                        </div>
                    ) : filteredOrdenes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Wrench className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400">No se encontraron órdenes</p>
                            <PermissionGate permission="orders.create">
                                <Link href="/ordenes/nueva">
                                    <Button variant="link" className="text-blue-400 mt-2">
                                        Crear primera orden
                                    </Button>
                                </Link>
                            </PermissionGate>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Orden</TableHead>
                                    <TableHead className="text-slate-400">Cliente / Equipo</TableHead>
                                    <TableHead className="text-slate-400">Estado</TableHead>
                                    <TableHead className="text-slate-400">Prioridad</TableHead>
                                    <TableHead className="text-slate-400">Técnico</TableHead>
                                    <TableHead className="text-slate-400">Fecha</TableHead>
                                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrdenes.map((orden) => {
                                    const estado = estadoConfig[orden.estado] || estadoConfig.recibido
                                    const prioridad = prioridadConfig[orden.prioridad] || prioridadConfig.normal
                                    const EstadoIcon = estado.icon

                                    return (
                                        <TableRow key={orden.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell>
                                                <p className="font-mono text-white font-medium">{orden.numero}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-white font-medium">{orden.cliente?.nombre || 'Sin cliente'}</p>
                                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                                        {orden.equipo_tipo}
                                                        {orden.equipo_marca && <span className="text-slate-500">· {orden.equipo_marca}</span>}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${estado.color} border-0 gap-1`}>
                                                    <EstadoIcon className="h-3 w-3" />
                                                    {estado.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={prioridad.color}>
                                                    {prioridad.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-slate-300">{orden.tecnico?.nombre || 'Sin asignar'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-slate-400 text-sm">
                                                    {format(new Date(orden.created_at), 'dd MMM yyyy', { locale: es })}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/ordenes/${orden.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
                                                        <Eye className="h-4 w-4" />
                                                        Ver
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
