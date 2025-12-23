// src/app/(cliente)/historial/page.tsx
// Customer history page - Premium Glass Redesign

'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    History,
    Wrench,
    Calendar,
    Search,
    Download,
    CheckCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { InvoiceDownloadButton } from '@/components/pdf/invoice-download-wrapper'

interface OrdenHistorial {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string | null
    equipo_modelo: string | null
    problema_reportado: string
    solucion: string | null
    costo_final: number | null
    fecha_entrega: string | null
    created_at: string
    estado: string
    pagado: boolean
    factura?: {
        id: string
        numero: string
        estado: string
    }
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export default function HistorialPage() {
    const [ordenes, setOrdenes] = useState<OrdenHistorial[]>([])
    const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenHistorial[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const loadHistorial = useCallback(async () => {
        try {
            const stored = localStorage.getItem('cliente_portal')
            if (!stored) return

            const cliente = JSON.parse(stored)

            // Fetch orders that are finished/delivered
            // Using the general endpoint and filtering client-side for now
            const response = await fetch(`/api/ordenes?cliente_id=${cliente.id}`)
            if (!response.ok) throw new Error('Error loading history')

            const data = await response.json()
            // Filter strictly for completed history
            const historial = data.filter((o: any) =>
                ['entregado', 'terminado'].includes(o.estado)
            )

            setOrdenes(historial)
            setFilteredOrdenes(historial)
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadHistorial()
    }, [loadHistorial])

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase()
        const filtered = ordenes.filter(o =>
            o.numero.toLowerCase().includes(lowerTerm) ||
            o.equipo_tipo.toLowerCase().includes(lowerTerm) ||
            o.equipo_marca?.toLowerCase().includes(lowerTerm) ||
            o.equipo_modelo?.toLowerCase().includes(lowerTerm)
        )
        setFilteredOrdenes(filtered)
    }, [searchTerm, ordenes])

    const totalReparaciones = ordenes.length
    const totalInvertido = ordenes.reduce((acc, o) => acc + (o.costo_final || 0), 0)

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Historial de Reparaciones
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Consulta tus reparaciones anteriores y garantías
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Reparaciones</p>
                            <p className="text-4xl font-bold text-slate-900">{totalReparaciones}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                    Equipos entregados
                                </Badge>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:rotate-12 transition-transform duration-300">
                            <Wrench className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Invertido</p>
                            <p className="text-4xl font-bold text-slate-900">${totalInvertido.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                    Histórico
                                </Badge>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:rotate-12 transition-transform duration-300">
                            <History className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search & List */}
            <motion.div variants={itemVariants} className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por equipo, marca o número de orden..."
                        className="pl-12 h-12 bg-white/60 border-slate-200 rounded-xl focus:bg-white transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-2xl bg-white/50" />
                        ))}
                    </div>
                ) : filteredOrdenes.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <History className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold text-slate-900 text-lg">No se encontraron reparaciones</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                                {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Tu historial de reparaciones aparecerá aquí una vez que completes tu primer servicio.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {filteredOrdenes.map((orden) => (
                            <div key={orden.id} className="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg text-slate-900">
                                                        {orden.equipo_tipo} {orden.equipo_marca}
                                                    </h3>
                                                    <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-500">
                                                        {orden.numero}
                                                    </Badge>
                                                </div>
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100">
                                                    Entregado
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {orden.fecha_entrega
                                                        ? format(new Date(orden.fecha_entrega), "d MMM yyyy", { locale: es })
                                                        : format(new Date(orden.created_at), "d MMM yyyy", { locale: es })
                                                    }
                                                </span>
                                                {orden.equipo_modelo && (
                                                    <span>• {orden.equipo_modelo}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Problema</span>
                                                <p className="text-sm text-slate-700 mt-1 line-clamp-2">{orden.problema_reportado}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Solución</span>
                                                <p className="text-sm text-slate-700 mt-1 line-clamp-2">{orden.solucion || 'Mantenimiento y reparación correctiva'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                {orden.pagado && orden.factura ? (
                                                    <InvoiceDownloadButton facturaId={orden.factura.id} />
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="text-slate-400 text-xs" disabled>
                                                        <Download className="h-3 w-3 mr-2" />
                                                        Sin factura
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 font-medium">Costo Total</span>
                                                <p className="text-xl font-bold text-slate-900">${orden.costo_final?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}
