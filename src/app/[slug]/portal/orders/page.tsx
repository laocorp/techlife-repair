'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogOut, Package, Clock, CheckCircle, Wrench, Search, AlertCircle } from 'lucide-react'

interface ClientSession {
    client_id: string
    name: string
    email: string
    tenant_slug: string
    expires: number
}

interface Order {
    id: string
    order_number: string
    device_type: string
    device_brand: string
    device_model: string
    status: string
    problem_description: string
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    diagnosed: { label: 'Diagnosticado', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    approved: { label: 'Aprobado', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    in_progress: { label: 'En Reparación', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    completed: { label: 'Completado', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    delivered: { label: 'Entregado', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    cancelled: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10' },
}

export default function ClientOrdersPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [session, setSession] = useState<ClientSession | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check session
        const storedSession = localStorage.getItem('client_session')
        if (!storedSession) {
            router.push(`/${slug}/portal`)
            return
        }

        const parsed: ClientSession = JSON.parse(storedSession)

        // Check if expired or wrong tenant
        if (parsed.expires < Date.now() || parsed.tenant_slug !== slug) {
            localStorage.removeItem('client_session')
            router.push(`/${slug}/portal`)
            return
        }

        setSession(parsed)
        fetchOrders(parsed.client_id)
    }, [slug, router])

    const fetchOrders = async (clientId: string) => {
        try {
            const res = await fetch(`/api/public/portal/orders?client_id=${clientId}`)
            const data = await res.json()

            if (res.ok) {
                setOrders(data.orders || [])
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('client_session')
        router.push(`/${slug}/portal`)
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased">
            {/* Header */}
            <header className="py-6 px-6 border-b border-zinc-800/50">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Link
                        href={`/${slug}`}
                        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{session.name}</span>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="py-8 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-xl font-medium mb-6">Mis Órdenes</h1>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-500">No tienes órdenes registradas</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => {
                                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                                return (
                                    <Link
                                        key={order.id}
                                        href={`/${slug}/tracking?order=${order.order_number}`}
                                        className="block p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">#{order.order_number}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.color} ${status.bg}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-400 truncate">
                                                    {order.device_type} {order.device_brand && `- ${order.device_brand}`} {order.device_model}
                                                </p>
                                                <p className="text-xs text-zinc-600 mt-1">
                                                    {new Date(order.created_at).toLocaleDateString('es-EC', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
