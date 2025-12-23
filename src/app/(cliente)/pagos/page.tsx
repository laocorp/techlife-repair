// src/app/(cliente)/pagos/page.tsx
// Customer payments/balance page - Premium Glass Redesign

'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    CheckCircle,
    Clock,
    AlertTriangle,
    CreditCard,
    Wallet,
    Download,
    Receipt,
    ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { InvoiceDownloadButton } from '@/components/pdf/invoice-download-wrapper'

interface Pago {
    id: string
    numero: string
    equipo_tipo: string
    costo_final: number | null
    pagado: boolean
    created_at: string
    estado: string
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

export default function PagosPage() {
    const [ordenes, setOrdenes] = useState<Pago[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadPagos = useCallback(async () => {
        try {
            const stored = localStorage.getItem('cliente_portal')
            if (!stored) return

            const cliente = JSON.parse(stored)

            // In a real scenario we would filter this on backend or fetch included invoice data
            // For now assuming the basic fetch includes what we need or we mock it
            const response = await fetch(`/api/ordenes?cliente_id=${cliente.id}`)
            if (!response.ok) throw new Error('Error loading payments')

            const data = await response.json()
            // Filter orders with cost
            setOrdenes(data.filter((o: any) => o.costo_final !== null))
        } catch (error) {
            console.error('Error loading payments:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPagos()
    }, [loadPagos])

    const pendientes = ordenes.filter(o => !o.pagado && o.costo_final)
    const pagados = ordenes.filter(o => o.pagado)
    const totalPendiente = pendientes.reduce((acc, o) => acc + (o.costo_final || 0), 0)
    const totalPagado = pagados.reduce((acc, o) => acc + (o.costo_final || 0), 0)

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Estado de Pagos
                </h1>
                <p className="text-slate-500 mt-1">
                    Controla tus gastos y descarga tus facturas
                </p>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Por Pagar</p>
                            <p className="text-4xl font-bold text-slate-900">${totalPendiente.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                    {pendientes.length} órdenes
                                </Badge>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:rotate-12 transition-transform duration-300">
                            <Clock className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/70 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Pagado</p>
                            <p className="text-4xl font-bold text-slate-900">${totalPagado.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                    {pagados.length} órdenes
                                </Badge>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:rotate-12 transition-transform duration-300">
                            <Wallet className="h-8 w-8" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Pending Alert */}
            {totalPendiente > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-200 to-orange-200 shadow-lg shadow-orange-500/10">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">
                                    Saldo pendiente: <span className="text-amber-600">${totalPendiente.toFixed(2)}</span>
                                </p>
                                <p className="text-sm text-slate-500">
                                    Recuerda cancelar el saldo pendiente al momento de retirar tu equipo.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Payment List */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Historial de Transacciones</h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <Card className="border-0 shadow-lg shadow-slate-200/40 bg-white/70 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                                ))}
                            </div>
                        ) : ordenes.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Receipt className="h-8 w-8" />
                                </div>
                                <p className="font-medium text-slate-900">Sin movimientos</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Los pagos aparecerán cuando tengas órdenes finalizadas con costo.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {ordenes.map((orden) => (
                                    <div key={orden.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${orden.pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center shadow-sm`}>
                                                {orden.pagado ? (
                                                    <CheckCircle className="h-6 w-6" />
                                                ) : (
                                                    <Clock className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900">
                                                        {orden.equipo_tipo}
                                                    </p>
                                                    <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-500">
                                                        {orden.numero}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {format(new Date(orden.created_at), "d MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                                            <div className="text-right">
                                                <p className={`font-bold text-lg ${orden.pagado ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    ${orden.costo_final?.toFixed(2)}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] border-0 px-2 py-0.5 ${orden.pagado ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                                                >
                                                    {orden.pagado ? 'Pagado' : 'Pendiente'}
                                                </Badge>
                                            </div>

                                            {/* Action Buttons */}
                                            {orden.pagado && orden.factura ? (
                                                <InvoiceDownloadButton facturaId={orden.factura.id} variant="outline" />
                                            ) : orden.pagado ? (
                                                // Mock download for demo purposes if no factura relation yet
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600" disabled title="Factura no disponible">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Payment Methods Info */}
            <motion.div variants={itemVariants}>
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-900/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Métodos de Pago</h3>
                            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                                Aceptamos efectivo, tarjetas de crédito/débito y transferencias bancarias.
                                El pago se realiza presencialmente al momento de retirar tu equipo o mediante transferencia previa contactando al taller.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
