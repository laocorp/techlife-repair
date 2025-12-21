'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    Package,
    Wrench,
    CheckCircle,
    Clock,
    ClipboardCheck,
    Truck,
    MessageSquare,
    Phone,
    Mail,
    CircleDot,
    ArrowRight,
    FileText,
    AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const }
    },
}

interface TrackingStep {
    id: string
    title: string
    description: string
    date: string | null
    status: 'completed' | 'active' | 'pending'
    icon: any
}

interface OrderData {
    id: string
    numero_orden: string
    equipo: string
    marca: string
    modelo: string
    estado: string
    problema: string
    diagnostico: string | null
    cotizacion: number | null
    costo_final: number | null
    created_at: string
    updated_at: string
    cliente: {
        nombre: string
        telefono: string
        email: string
    }
    empresa: {
        nombre: string
        telefono: string
    }
}

const estadoToStep: Record<string, number> = {
    recibido: 0,
    en_diagnostico: 1,
    cotizado: 2,
    aprobado: 3,
    en_reparacion: 4,
    terminado: 5,
    entregado: 6,
}

export default function TrackingPage() {
    const [searchCode, setSearchCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [order, setOrder] = useState<OrderData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleSearch = async () => {
        if (!searchCode.trim()) return

        setIsSearching(true)
        setError(null)
        setOrder(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('ordenes_servicio')
                .select(`
                    *,
                    cliente:clientes(nombre, telefono, email),
                    empresa:empresas(nombre, telefono)
                `)
                .eq('numero_orden', searchCode.toUpperCase().trim())
                .single()

            if (fetchError || !data) {
                setError('No se encontró ninguna orden con ese código. Verifica e intenta de nuevo.')
                return
            }

            setOrder(data as OrderData)
        } catch (err) {
            setError('Error al buscar la orden. Intenta de nuevo.')
        } finally {
            setIsSearching(false)
        }
    }

    const getTrackingSteps = (order: OrderData): TrackingStep[] => {
        const currentStep = estadoToStep[order.estado] || 0

        const steps: TrackingStep[] = [
            {
                id: 'recibido',
                title: 'Recibido',
                description: 'Tu equipo ha sido recibido en nuestro centro de servicio',
                date: order.created_at,
                status: currentStep >= 0 ? 'completed' : 'pending',
                icon: Package,
            },
            {
                id: 'en_diagnostico',
                title: 'En Diagnóstico',
                description: 'Nuestros técnicos están evaluando el problema',
                date: currentStep >= 1 ? order.updated_at : null,
                status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending',
                icon: Search,
            },
            {
                id: 'cotizado',
                title: 'Cotizado',
                description: order.cotizacion ? `Cotización: $${order.cotizacion.toFixed(2)}` : 'Esperando cotización',
                date: currentStep >= 2 ? order.updated_at : null,
                status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending',
                icon: FileText,
            },
            {
                id: 'aprobado',
                title: 'Aprobado',
                description: 'La reparación ha sido aprobada',
                date: currentStep >= 3 ? order.updated_at : null,
                status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending',
                icon: ClipboardCheck,
            },
            {
                id: 'en_reparacion',
                title: 'En Reparación',
                description: 'Tu equipo está siendo reparado',
                date: currentStep >= 4 ? order.updated_at : null,
                status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'active' : 'pending',
                icon: Wrench,
            },
            {
                id: 'terminado',
                title: 'Terminado',
                description: 'La reparación ha sido completada exitosamente',
                date: currentStep >= 5 ? order.updated_at : null,
                status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'active' : 'pending',
                icon: CheckCircle,
            },
            {
                id: 'entregado',
                title: 'Entregado',
                description: 'Tu equipo ha sido entregado',
                date: currentStep >= 6 ? order.updated_at : null,
                status: currentStep === 6 ? 'completed' : 'pending',
                icon: Truck,
            },
        ]

        return steps
    }

    const formatDate = (date: string | null) => {
        if (!date) return null
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">RepairApp</h1>
                            <p className="text-xs text-slate-500">Tracking de Órdenes</p>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto px-4 py-8"
            >
                {/* Search Section */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">
                        Rastrea tu Orden
                    </h2>
                    <p className="text-slate-600 max-w-md mx-auto">
                        Ingresa el código de tu orden para ver el estado actual de tu reparación
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-10">
                    <div className="flex gap-3 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Ej: ORD-2024-0001"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-12 h-14 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400/20 text-lg"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchCode.trim()}
                            className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold disabled:opacity-50"
                        >
                            {isSearching ? (
                                <div className="w-5 h-5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                            ) : (
                                'Buscar'
                            )}
                        </Button>
                    </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-xl mx-auto mb-8"
                    >
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Order Details */}
                {order && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Order Summary Card */}
                        <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 p-6 border-b border-zinc-800/50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-cyan-500/10 text-cyan-400 border-0 text-xs font-semibold">
                                                {order.numero_orden}
                                            </Badge>
                                            <Badge className={`border-0 text-xs font-semibold ${order.estado === 'entregado'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : order.estado === 'terminado'
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-violet-500/10 text-violet-400'
                                                }`}>
                                                {order.estado.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{order.equipo}</h3>
                                        <p className="text-zinc-400 text-sm mt-1">
                                            {order.marca} {order.modelo}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 mb-1">Costo estimado</p>
                                        <p className="text-2xl font-bold text-white">
                                            ${(order.costo_final || order.cotizacion || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Problema Reportado</p>
                                        <p className="text-sm text-zinc-300">{order.problema}</p>
                                    </div>
                                    {order.diagnostico && (
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Diagnóstico</p>
                                            <p className="text-sm text-zinc-300">{order.diagnostico}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking Timeline */}
                        <Card className="bg-zinc-900/50 border-zinc-800/50">
                            <div className="p-6 border-b border-zinc-800/50">
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-cyan-400" />
                                    Estado del Servicio
                                </h4>
                            </div>
                            <CardContent className="p-6">
                                <div className="space-y-0">
                                    {getTrackingSteps(order).map((step, index) => {
                                        const Icon = step.icon
                                        const isLast = index === getTrackingSteps(order).length - 1

                                        return (
                                            <div key={step.id} className="relative">
                                                {/* Connecting Line */}
                                                {!isLast && (
                                                    <div className={`absolute left-[15px] top-[40px] w-0.5 h-[calc(100%-8px)] ${step.status === 'completed'
                                                        ? 'bg-emerald-500'
                                                        : step.status === 'active'
                                                            ? 'bg-gradient-to-b from-cyan-500 to-zinc-700'
                                                            : 'bg-zinc-800'
                                                        }`} />
                                                )}

                                                <div className="flex gap-4 pb-6">
                                                    {/* Icon Circle */}
                                                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'completed'
                                                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                                        : step.status === 'active'
                                                            ? 'bg-cyan-500/20 border-2 border-cyan-500 shadow-lg shadow-cyan-500/30'
                                                            : 'bg-zinc-800/50 border-2 border-zinc-700'
                                                        }`}>
                                                        <Icon className={`h-4 w-4 ${step.status === 'completed'
                                                            ? 'text-emerald-400'
                                                            : step.status === 'active'
                                                                ? 'text-cyan-400'
                                                                : 'text-zinc-500'
                                                            }`} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pt-0.5">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className={`font-medium ${step.status === 'pending' ? 'text-zinc-500' : 'text-white'
                                                                }`}>
                                                                {step.title}
                                                            </h5>
                                                            {step.date && step.status !== 'pending' && (
                                                                <span className="text-xs text-zinc-500">
                                                                    {formatDate(step.date)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm mt-0.5 ${step.status === 'pending' ? 'text-zinc-600' : 'text-zinc-400'
                                                            }`}>
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card className="bg-zinc-900/50 border-zinc-800/50">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-1">¿Tienes preguntas?</h4>
                                        <p className="text-sm text-zinc-400">
                                            Contacta a {order.empresa?.nombre || 'nuestro equipo'} para más información
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        {order.empresa?.telefono && (
                                            <a href={`tel:${order.empresa.telefono}`}>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    Llamar
                                                </Button>
                                            </a>
                                        )}
                                        <a href={`https://wa.me/${order.empresa?.telefono?.replace(/\D/g, '')}`} target="_blank">
                                            <Button className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                                                <MessageSquare className="h-4 w-4" />
                                                WhatsApp
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Empty State */}
                {!order && !error && !isSearching && (
                    <motion.div variants={itemVariants} className="text-center py-16">
                        <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-6 border border-zinc-700/50">
                            <Package className="h-10 w-10 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Ingresa tu código de orden
                        </h3>
                        <p className="text-zinc-500 max-w-sm mx-auto">
                            El código se encuentra en el comprobante que recibiste al dejar tu equipo
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* Footer */}
            <div className="border-t border-zinc-800/50 mt-auto">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center">
                    <p className="text-xs text-zinc-600">
                        © {new Date().getFullYear()} RepairApp. Sistema de Servicio Técnico Profesional.
                    </p>
                </div>
            </div>
        </div>
    )
}
