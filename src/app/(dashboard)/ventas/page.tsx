'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores'
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
import { toast } from 'sonner'
import {
    Search,
    FileText,
    Receipt,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye,
    Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Venta {
    id: string
    numero: string
    total: number
    metodo_pago: string
    created_at: string
    cliente: {
        nombre: string
        identificacion: string
    } | null
    factura: {
        estado: string
        numero_autorizacion: string | null
    } | null
}

const estadoConfig: Record<string, { label: string; color: string; icon: any }> = {
    autorizado: { label: 'Autorizado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
    firmado: { label: 'Firmado (Enviando)', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    generado: { label: 'Generado', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
    devuelta: { label: 'Devuelta SRI', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    nota_venta: { label: 'Nota de Venta', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Receipt },
}

export default function VentasPage() {
    const { user } = useAuthStore()
    const [ventas, setVentas] = useState<Venta[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const loadVentas = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/ventas?empresa_id=${user.empresa_id}&limit=100`)
            if (!response.ok) throw new Error('Error al cargar ventas')
            const data = await response.json()
            setVentas(data)
        } catch (error) {
            console.error(error)
            toast.error('No se pudo cargar el historial de ventas')
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadVentas()
    }, [loadVentas])

    const filteredVentas = ventas.filter(v =>
        v.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cliente?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cliente?.identificacion.includes(searchQuery)
    )

    const getEstadoBadge = (venta: Venta) => {
        if (!venta.factura) {
            const config = estadoConfig['nota_venta']
            return (
                <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
                    <config.icon className="w-3 h-3" />
                    {config.label}
                </Badge>
            )
        }

        const estado = venta.factura.estado.toLowerCase()
        const config = estadoConfig[estado] || { label: estado, color: 'bg-gray-100', icon: AlertCircle }

        return (
            <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
                <config.icon className="w-3 h-3" />
                {config.label.toUpperCase()}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
                    <p className="text-muted-foreground">Gestiona tus facturas y notas de venta.</p>
                </div>
                <Link href="/pos">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Venta (POS)
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por número, cliente o RUC..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Cargando ventas...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredVentas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron ventas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVentas.map((venta) => (
                                        <TableRow key={venta.id}>
                                            <TableCell className="font-medium">{venta.numero}</TableCell>
                                            <TableCell>
                                                {format(new Date(venta.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{venta.cliente?.nombre || 'Consumidor Final'}</span>
                                                    <span className="text-xs text-muted-foreground">{venta.cliente?.identificacion}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getEstadoBadge(venta)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">
                                                ${Number(venta.total).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/ventas/${venta.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Detalles
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
