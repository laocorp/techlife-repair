// src/app/(cliente)/historial/page.tsx
// Customer repair history - using fetch API

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    History,
    CheckCircle,
    Package,
    ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OrdenHistorial {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string | null
    equipo_modelo: string | null
    estado: string
    costo_final: number | null
    created_at: string
    updated_at: string
}

export default function HistorialPage() {
    const [ordenes, setOrdenes] = useState<OrdenHistorial[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadHistorial = useCallback(async () => {
        try {
            const stored = localStorage.getItem('cliente_portal')
            if (!stored) return

            const cliente = JSON.parse(stored)

            const response = await fetch(`/api/ordenes?cliente_id=${cliente.id}`)
            if (!response.ok) throw new Error('Error loading history')

            const data = await response.json()
            // Filter only delivered orders
            setOrdenes(data.filter((o: any) => o.estado === 'entregado'))
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadHistorial()
    }, [loadHistorial])

    const totalGastado = ordenes.reduce((acc, o) => acc + (o.costo_final || 0), 0)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Historial de Reparaciones
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Todas tus reparaciones completadas
                </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="card-linear">
                    <CardContent className="p-4 text-center">
                        <History className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--text-muted))]" />
                        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">{ordenes.length}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">Reparaciones</p>
                    </CardContent>
                </Card>
                <Card className="card-linear">
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                        <p className="text-2xl font-bold text-emerald-400">${totalGastado.toFixed(0)}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">Total Invertido</p>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <Card className="card-linear">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[hsl(var(--text-primary))]">
                        Reparaciones Completadas
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
                            <Package className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                            <p className="text-[hsl(var(--text-secondary))]">Sin historial</p>
                            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                Tu historial aparecerá cuando completes reparaciones
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(var(--border-subtle))]">
                            {ordenes.map((orden) => (
                                <Link key={orden.id} href={`/tracking/${orden.id}`}>
                                    <div className="p-4 hover:bg-[hsl(var(--interactive-hover))] transition-colors cursor-pointer flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[hsl(var(--text-primary))]">
                                                    {orden.equipo_tipo}
                                                </p>
                                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                                    {orden.equipo_marca} · {format(new Date(orden.updated_at), "d MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {orden.costo_final && (
                                                <span className="text-sm font-medium text-[hsl(var(--text-primary))]">
                                                    ${orden.costo_final.toFixed(2)}
                                                </span>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-[hsl(var(--text-muted))]" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
