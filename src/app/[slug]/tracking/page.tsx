'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Wrench, Search, ArrowLeft, Loader2, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface OrderResult {
    id: string
    order_number: string
    device_type: string
    device_brand: string
    device_model: string
    status: string
    problem_description: string
    created_at: string
    updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-500', icon: Clock },
    diagnosed: { label: 'Diagnosticado', color: 'text-blue-500', icon: Search },
    approved: { label: 'Aprobado', color: 'text-emerald-500', icon: CheckCircle },
    in_progress: { label: 'En Reparación', color: 'text-purple-500', icon: Wrench },
    completed: { label: 'Completado', color: 'text-emerald-500', icon: CheckCircle },
    delivered: { label: 'Entregado', color: 'text-zinc-400', icon: Package },
    cancelled: { label: 'Cancelado', color: 'text-red-500', icon: AlertCircle },
}

export default function TrackingPage() {
    const params = useParams()
    const slug = params.slug as string

    const [orderNumber, setOrderNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [order, setOrder] = useState<OrderResult | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setOrder(null)
        setLoading(true)

        try {
            const res = await fetch(`/api/public/tracking?slug=${slug}&order=${orderNumber}`)
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Orden no encontrada')
                return
            }

            setOrder(data.order)
        } catch {
            setError('Error al buscar la orden')
        } finally {
            setLoading(false)
        }
    }

    const statusConfig = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null
    const StatusIcon = statusConfig?.icon || Clock

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased">
            {/* Header */}
            <header className="py-6 px-6">
                <div className="max-w-lg mx-auto">
                    <Link
                        href={`/${slug}`}
                        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </Link>
                </div>
            </header>

            {/* Main */}
            <main className="py-8 px-6">
                <div className="max-w-lg mx-auto">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h1 className="text-xl font-medium mb-2">Rastrear Orden</h1>
                        <p className="text-sm text-zinc-500">
                            Ingresa tu número de orden para ver el estado
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="space-y-4 mb-8">
                        <div className="space-y-1.5">
                            <label className="text-xs text-zinc-400">Número de Orden</label>
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                placeholder="Ej: ORD-001"
                                required
                                className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Buscar
                                </>
                            )}
                        </button>
                    </form>

                    {/* Order Result */}
                    {order && (
                        <div className="rounded-xl bg-zinc-900 p-6 space-y-6">
                            {/* Status */}
                            <div className="text-center">
                                <div className={`w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 ${statusConfig?.color}`}>
                                    <StatusIcon className="w-8 h-8" />
                                </div>
                                <p className={`text-lg font-medium ${statusConfig?.color}`}>
                                    {statusConfig?.label}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Orden #{order.order_number}
                                </p>
                            </div>

                            {/* Device Info */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Dispositivo</span>
                                    <span>{order.device_type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Marca</span>
                                    <span>{order.device_brand || '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Modelo</span>
                                    <span>{order.device_model || '—'}</span>
                                </div>
                                <div className="h-px bg-zinc-800" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Fecha de ingreso</span>
                                    <span>{new Date(order.created_at).toLocaleDateString('es-EC')}</span>
                                </div>
                            </div>

                            {/* Problem */}
                            {order.problem_description && (
                                <div>
                                    <p className="text-xs text-zinc-500 mb-2">Problema reportado</p>
                                    <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-3">
                                        {order.problem_description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
