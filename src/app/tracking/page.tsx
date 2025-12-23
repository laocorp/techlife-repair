'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PremiumBackground } from '@/components/ui/premium-background'
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
    numero: string
    equipo_tipo: string
    equipo_marca: string
    equipo_modelo: string
    estado: string
    problema_reportado: string
    diagnostico: string | null
    costo_estimado: number | null
    costo_final: number | null
    created_at: string
    updated_at: string
    cliente: {
        nombre: string
        telefono: string
        email: string
    } | null
    equipo_serie?: string | null
    equipo_accesorios?: string | null
    solucion?: string | null
    fecha_promesa?: string | null
    fecha_entrega?: string | null
    tecnico?: {
        nombre: string
    } | null
    empresa?: {
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

function TrackingContent() {
    const [searchCode, setSearchCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [order, setOrder] = useState<OrderData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const searchParams = useSearchParams()

    const performSearch = async (code: string) => {
        if (!code.trim()) return

        setIsSearching(true)
        setError(null)
        setOrder(null)
        setSearchCode(code)

        try {
            const response = await fetch(`/api/ordenes/tracking?numero=${encodeURIComponent(code.toUpperCase().trim())}`)

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || 'No se encontró ninguna orden con ese código. Verifica e intenta de nuevo.')
                return
            }

            const data = await response.json()
            setOrder(data)
        } catch (err) {
            setError('Error al buscar la orden. Intenta de nuevo.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSearch = () => performSearch(searchCode)

    useEffect(() => {
        const numero = searchParams.get('numero')
        if (numero) {
            performSearch(numero)
        }
    }, [searchParams])

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
                description: order.costo_estimado ? `Cotización: $${order.costo_estimado.toFixed(2)}` : 'Esperando cotización',
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

    const getWhatsAppMessage = (order: OrderData) => {
        const greetings = ['Hola', 'Buen día', 'Saludos']
        const greeting = greetings[Math.floor(Math.random() * greetings.length)]
        const base = `${greeting}, consulto por mi orden *${order.numero}* (${order.equipo_marca} ${order.equipo_modelo}).`

        switch (order.estado) {
            case 'recibido':
                return `${base} Quisiera saber cuándo podrán revisarla.`
            case 'en_diagnostico':
                return `${base} Me gustaría saber el diagnóstico.`
            case 'cotizado':
                return `${base} Tengo una duda sobre la cotización.`
            case 'aprobado':
                return `${base} ¿Para cuándo estaría lista la reparación?`
            case 'en_reparacion':
                return `${base} ¿Cómo va el avance de la reparación?`
            case 'terminado':
                return `${base} ¿En qué horario puedo pasar a retirar?`
            case 'entregado':
                return `${base} Muchas gracias por el servicio.`
            default:
                return `${base} Quisiera información sobre su estado.`
        }
    }

    return (
        <div className="min-h-screen relative text-slate-900 overflow-x-hidden">
            <PremiumBackground />

            {/* Header */}
            <div className="border-b border-white/20 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">RepairApp</h1>
                            <p className="text-xs text-slate-500 font-medium">Tracking de Órdenes</p>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto px-4 py-8 relative z-10"
            >
                {/* Search Section */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Rastrea tu Orden
                    </h2>
                    <p className="text-slate-600 max-w-md mx-auto text-lg leading-relaxed">
                        Ingresa el código de tu orden para ver el estado en tiempo real.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-12">
                    <div className="flex gap-3 max-w-xl mx-auto p-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Ej: TEC-X8K9L2"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-12 h-12 bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 text-lg font-medium"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchCode.trim()}
                            className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isSearching ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            </div>
                            <p className="text-sm font-medium text-red-800">{error}</p>
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
                        <Card className="bg-white/80 backdrop-blur-md border-white/50 shadow-xl shadow-slate-200/40 overflow-hidden ring-1 ring-white/60">
                            <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-100">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                {order.numero}
                                            </Badge>
                                            <Badge className={`border-0 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm ${order.estado === 'entregado'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : order.estado === 'terminado'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.estado.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{order.equipo_tipo}</h3>
                                        <p className="text-slate-500 text-lg mt-1 font-medium">
                                            {order.equipo_marca} {order.equipo_modelo}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Costo estimado</p>
                                        <p className="text-3xl font-bold text-slate-900">
                                            ${(order.costo_final || order.costo_estimado || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Column 1 */}
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Problema Reportado</p>
                                            </div>
                                            <p className="text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {order.problema_reportado}
                                            </p>
                                        </div>

                                        {/* Show Solution if available */}
                                        {order.solucion && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Solución / Trabajo Realizado</p>
                                                </div>
                                                <p className="text-base text-slate-700 leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                                    {order.solucion}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            {order.equipo_serie && (
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Serie / IMEI</p>
                                                    <p className="text-sm font-medium text-slate-700 font-mono">{order.equipo_serie}</p>
                                                </div>
                                            )}
                                            {order.tecnico && (
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Técnico A cargo</p>
                                                    <p className="text-sm font-medium text-slate-700">{order.tecnico.nombre}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-6">
                                        {order.diagnostico && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wrench className="w-4 h-4 text-slate-400" />
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Diagnóstico Técnico</p>
                                                </div>
                                                <p className="text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    {order.diagnostico}
                                                </p>
                                            </div>
                                        )}

                                        {order.equipo_accesorios && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Accesorios Recibidos</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {order.equipo_accesorios.split(',').map((acc, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                                                            {acc.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fecha Recepción</p>
                                                <p className="text-sm font-medium text-slate-700">{formatDate(order.created_at)}</p>
                                            </div>
                                            {/* Show Promise Date only if active and not delivered */}
                                            {order.fecha_entrega ? (
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fecha Entrega</p>
                                                    <p className="text-sm font-medium text-slate-700">{formatDate(order.fecha_entrega)}</p>
                                                </div>
                                            ) : (
                                                // Assuming fecha_promesa exists on order object (we need to check interface)
                                                // I'll assume I add it to interface below
                                                (order as any).fecha_promesa && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fecha Promesa</p>
                                                        <p className="text-sm font-medium text-slate-700">{formatDate((order as any).fecha_promesa)}</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking Timeline */}
                        <Card className="bg-white/80 backdrop-blur-md border-white/50 shadow-xl shadow-slate-200/40">
                            <div className="p-6 border-b border-slate-100">
                                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-slate-500" />
                                    Línea de Tiempo
                                </h4>
                            </div>
                            <CardContent className="p-8">
                                <div className="space-y-0">
                                    {getTrackingSteps(order).map((step, index) => {
                                        const Icon = step.icon
                                        const isLast = index === getTrackingSteps(order).length - 1

                                        return (
                                            <div key={step.id} className="relative group">
                                                {/* Connecting Line */}
                                                {!isLast && (
                                                    <div className={`absolute left-[19px] top-[40px] w-0.5 h-[calc(100%-8px)] transition-colors duration-500 ${step.status === 'completed'
                                                        ? 'bg-slate-900'
                                                        : step.status === 'active'
                                                            ? 'bg-gradient-to-b from-slate-900 to-slate-200'
                                                            : 'bg-slate-200'
                                                        }`} />
                                                )}

                                                <div className="flex gap-6 pb-8">
                                                    {/* Icon Circle */}
                                                    <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm ${step.status === 'completed'
                                                        ? 'bg-slate-900 text-white shadow-slate-900/20'
                                                        : step.status === 'active'
                                                            ? 'bg-slate-900 text-white scale-110 shadow-slate-900/30'
                                                            : 'bg-white border border-slate-200 text-slate-300'
                                                        }`}>
                                                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 pt-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h5 className={`font-semibold text-base transition-colors ${step.status === 'pending' ? 'text-slate-500' : 'text-slate-900'
                                                                }`}>
                                                                {step.title}
                                                            </h5>
                                                            {step.date && step.status !== 'pending' && (
                                                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                                    {formatDate(step.date)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm leading-relaxed transition-colors ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-600'
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
                        <Card className="bg-slate-900 text-white shadow-xl shadow-slate-900/20 overflow-hidden relative">
                            {/* Decorative background for card */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <CardContent className="p-8 relative z-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">¿Necesitas ayuda adicional?</h4>
                                        <p className="text-slate-300 text-base">
                                            Estamos aquí para responder tus dudas sobre la orden <span className="text-white font-semibold">{order.numero}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        {order.empresa?.telefono && (
                                            <a href={`tel:${order.empresa.telefono}`} className="flex-1 md:flex-none">
                                                <Button
                                                    className="w-full h-12 gap-2 border border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    Llamar
                                                </Button>
                                            </a>
                                        )}
                                        <a
                                            href={`https://wa.me/${order.empresa?.telefono?.replace(/\D/g, '')}?text=${encodeURIComponent(getWhatsAppMessage(order))}`}
                                            target="_blank"
                                            className="flex-1 md:flex-none"
                                        >
                                            <Button className="w-full h-12 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold border-0 shadow-lg shadow-emerald-900/20">
                                                <MessageSquare className="h-5 w-5" />
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
                    <motion.div variants={itemVariants} className="text-center py-20">
                        <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8 ring-1 ring-slate-100">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <Package className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Ingresa tu código de orden
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto text-lg">
                            Lo encontrarás en el comprobante que recibiste en nuestro local.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* Footer */}
            <div className="border-t border-slate-200 mt-auto bg-white/50 backdrop-blur-sm relative z-10">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        © {new Date().getFullYear()} RepairApp. Sistema de Servicio Técnico Profesional.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function TrackingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <TrackingContent />
        </Suspense>
    )
}
