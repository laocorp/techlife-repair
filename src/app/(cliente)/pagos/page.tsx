// src/app/(cliente)/pagos/page.tsx
// Customer payments/balance page

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DollarSign,
    CheckCircle,
    Clock,
    AlertTriangle,
    CreditCard,
    Wallet,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Pago {
    id: string
    numero_orden: string
    equipo: string
    costo_final: number | null
    pagado: boolean
    created_at: string
    estado: string
}

export default function PagosPage() {
    const [ordenes, setOrdenes] = useState<Pago[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const loadPagos = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: cliente } = await supabase
                    .from('clientes')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                if (!cliente) return

                // Get orders with payment info
                const { data, error } = await supabase
                    .from('ordenes_servicio')
                    .select('id, numero_orden, equipo, costo_final, pagado, created_at, estado')
                    .eq('cliente_id', cliente.id)
                    .not('costo_final', 'is', null)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setOrdenes(data || [])
            } catch (error) {
                console.error('Error loading payments:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadPagos()
    }, [supabase])

    const pendientes = ordenes.filter(o => !o.pagado && o.costo_final)
    const pagados = ordenes.filter(o => o.pagado)
    const totalPendiente = pendientes.reduce((acc, o) => acc + (o.costo_final || 0), 0)
    const totalPagado = pagados.reduce((acc, o) => acc + (o.costo_final || 0), 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Estado de Pagos
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Revisa tus pagos pendientes y completados
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="card-linear border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--text-muted))]">Pendiente</p>
                                <p className="text-xl font-bold text-amber-400">${totalPendiente.toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="text-xs text-[hsl(var(--text-muted))]">
                            {pendientes.length} orden(es) por pagar
                        </p>
                    </CardContent>
                </Card>
                <Card className="card-linear border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--text-muted))]">Pagado</p>
                                <p className="text-xl font-bold text-emerald-400">${totalPagado.toFixed(2)}</p>
                            </div>
                        </div>
                        <p className="text-xs text-[hsl(var(--text-muted))]">
                            {pagados.length} orden(es) pagadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Alert */}
            {totalPendiente > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 flex items-center gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-[hsl(var(--text-primary))]">
                                Tienes ${totalPendiente.toFixed(2)} pendiente de pago
                            </p>
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                Paga al retirar tu equipo del taller
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payment List */}
            <Card className="card-linear">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                        Detalle de Pagos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-[hsl(var(--surface-highlight))]" />
                            ))}
                        </div>
                    ) : ordenes.length === 0 ? (
                        <div className="p-8 text-center">
                            <Wallet className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                            <p className="text-[hsl(var(--text-secondary))]">Sin movimientos</p>
                            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                Los pagos aparecerán cuando tengas órdenes con costo
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(var(--border-subtle))]">
                            {ordenes.map((orden) => (
                                <div key={orden.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${orden.pagado ? 'bg-emerald-500/10' : 'bg-amber-500/10'} flex items-center justify-center`}>
                                            {orden.pagado ? (
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-amber-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[hsl(var(--text-primary))]">
                                                {orden.equipo}
                                            </p>
                                            <p className="text-xs text-[hsl(var(--text-muted))]">
                                                {orden.numero_orden} · {format(new Date(orden.created_at), "d MMM", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${orden.pagado ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${orden.costo_final?.toFixed(2)}
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] ${orden.pagado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                                        >
                                            {orden.pagado ? 'Pagado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Card className="card-linear">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                        <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                            Métodos de Pago Aceptados
                        </p>
                    </div>
                    <p className="text-xs text-[hsl(var(--text-muted))]">
                        Efectivo, tarjeta de crédito/débito, transferencia bancaria.
                        El pago se realiza al momento de retirar el equipo.
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    )
}
