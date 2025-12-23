// Public Order Tracking Page - No authentication required
// Uses fetch instead of Supabase server

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Wrench,
    Clock,
    CheckCircle,
    AlertTriangle,
    Search,
    Package,
    User,
    Phone,
    MapPin,
    Calendar,
} from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ id: string }>
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; step: number }> = {
    recibido: { label: 'Recibido', color: 'text-slate-400', bgColor: 'bg-slate-500', icon: Clock, step: 1 },
    en_diagnostico: { label: 'En Diagnóstico', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: Search, step: 2 },
    cotizado: { label: 'Cotizado', color: 'text-amber-400', bgColor: 'bg-amber-500', icon: AlertTriangle, step: 3 },
    aprobado: { label: 'Aprobado', color: 'text-cyan-400', bgColor: 'bg-cyan-500', icon: CheckCircle, step: 4 },
    en_reparacion: { label: 'En Reparación', color: 'text-violet-400', bgColor: 'bg-violet-500', icon: Wrench, step: 5 },
    terminado: { label: 'Terminado', color: 'text-emerald-400', bgColor: 'bg-emerald-500', icon: CheckCircle, step: 6 },
    entregado: { label: 'Entregado', color: 'text-green-400', bgColor: 'bg-green-500', icon: CheckCircle, step: 7 },
}

const allSteps = ['recibido', 'en_diagnostico', 'cotizado', 'aprobado', 'en_reparacion', 'terminado', 'entregado']

async function getOrdenData(id: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/ordenes/${id}`, {
            cache: 'no-store'
        })

        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error('Error fetching order:', error)
        return null
    }
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export default async function TrackingPage({ params }: PageProps) {
    const { id } = await params
    const orden = await getOrdenData(id)

    if (!orden) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
                <Card className="bg-white/5 border-white/10 max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-red-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Orden No Encontrada</h1>
                        <p className="text-slate-400 mb-6">
                            No pudimos encontrar la orden que buscas. Verifica el enlace o código QR.
                        </p>
                        <Link href="/" className="text-blue-400 hover:underline">
                            Ir al inicio
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const estado = estadoConfig[orden.estado] || estadoConfig.recibido
    const EstadoIcon = estado.icon
    const currentStep = estado.step

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-indigo-100/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-800 tracking-tight">RepairApp</span>
                    </div>
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 font-medium px-3 py-1">
                        Seguimiento
                    </Badge>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Order Header */}
                <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-xl shadow-indigo-100/20 overflow-hidden">
                    <div className={`h-2 ${estado.bgColor}`} />
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Orden de Servicio</p>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{orden.numero}</h1>
                                <p className="text-slate-600 mt-2 flex items-center gap-2 font-medium">
                                    {orden.empresa?.nombre}
                                </p>
                            </div>
                            <div className="text-left md:text-right">
                                <Badge className={`${estado.bgColor} border-2 border-white text-white gap-2 px-4 py-2 text-base shadow-lg shadow-blue-500/10`}>
                                    <EstadoIcon className="h-4 w-4" />
                                    {estado.label}
                                </Badge>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Estado Actual</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Steps */}
                <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-xl shadow-indigo-100/20">
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                            Progreso del Servicio
                        </h2>
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="absolute top-5 left-4 right-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full"
                                    style={{ width: `${((currentStep - 1) / (allSteps.length - 1)) * 100}%` }}
                                />
                            </div>

                            {/* Steps */}
                            <div className="relative flex justify-between z-10">
                                {allSteps.map((step, index) => {
                                    const stepConfig = estadoConfig[step]
                                    const isCompleted = index < currentStep - 1
                                    const isCurrent = index === currentStep - 1
                                    const StepIcon = stepConfig.icon

                                    return (
                                        <div key={step} className="flex flex-col items-center group">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${isCompleted || isCurrent
                                                    ? `${stepConfig.bgColor} text-white shadow-blue-500/20 scale-110`
                                                    : 'bg-white border-2 border-slate-100 text-slate-300'
                                                    }`}
                                            >
                                                <StepIcon className="h-5 w-5" />
                                            </div>
                                            <p
                                                className={`text-[10px] md:text-xs mt-3 text-center max-w-[70px] font-medium transition-colors ${isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-slate-600' : 'text-slate-300'
                                                    }`}
                                            >
                                                {stepConfig.label}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Equipment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-xl shadow-indigo-100/20 h-full">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Package className="h-5 w-5 text-purple-600" />
                                </div>
                                Equipo
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-indigo-50">
                                    <span className="text-sm text-slate-500">Tipo</span>
                                    <span className="text-sm font-semibold text-slate-700">{orden.equipo_tipo}</span>
                                </div>
                                {orden.equipo_marca && (
                                    <div className="flex justify-between items-center py-2 border-b border-indigo-50">
                                        <span className="text-sm text-slate-500">Marca</span>
                                        <span className="text-sm font-semibold text-slate-700">{orden.equipo_marca}</span>
                                    </div>
                                )}
                                {orden.equipo_modelo && (
                                    <div className="flex justify-between items-center py-2 border-b border-indigo-50">
                                        <span className="text-sm text-slate-500">Modelo</span>
                                        <span className="text-sm font-semibold text-slate-700">{orden.equipo_modelo}</span>
                                    </div>
                                )}
                                {orden.equipo_serie && (
                                    <div className="flex justify-between items-center py-2 border-b border-indigo-50">
                                        <span className="text-sm text-slate-500">Serie</span>
                                        <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{orden.equipo_serie}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-xl shadow-indigo-100/20 h-full">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                </div>
                                Diagnóstico
                            </h2>

                            {orden.problema_reportado && (
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Problema Reportado</p>
                                    <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm leading-relaxed border border-indigo-50/50">
                                        {orden.problema_reportado}
                                    </div>
                                </div>
                            )}

                            {orden.diagnostico && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Informe Técnico</p>
                                    <div className="bg-indigo-50/50 rounded-xl p-4 text-slate-700 text-sm leading-relaxed border border-indigo-100/50">
                                        {orden.diagnostico}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Costs (if available) */}
                {(orden.costo_estimado || orden.costo_final) && (
                    <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 border-0">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold opacity-90">Resumen de Costos</h2>
                                    <p className="text-blue-100 text-sm opacity-80">Incluye mano de obra y repuestos</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    {orden.costo_estimado && (
                                        <div className="text-right">
                                            <p className="text-sm text-blue-200 font-medium">Estimado</p>
                                            <p className="text-2xl font-bold">${orden.costo_estimado.toFixed(2)}</p>
                                        </div>
                                    )}
                                    {orden.costo_final && (
                                        <div className="text-right bg-white/10 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10">
                                            <p className="text-xs text-blue-100 font-bold uppercase tracking-wider">Total Final</p>
                                            <p className="text-3xl font-bold text-white">${orden.costo_final.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info & Contact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-xl shadow-indigo-100/20">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                </div>
                                Detalles
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Fecha de Ingreso</p>
                                        <p className="text-sm text-slate-500">{formatDate(orden.created_at)}</p>
                                    </div>
                                </div>
                                {orden.tecnico && (
                                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">Técnico Asignado</p>
                                            <p className="text-sm text-slate-500">{orden.tecnico.nombre}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-indigo-900 text-white shadow-xl shadow-indigo-900/20 border-0 overflow-hidden relative">
                        {/* Abstract Background pattern */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

                        <CardContent className="p-6 md:p-8 relative z-10">
                            <h2 className="text-lg font-bold text-white mb-6">Contacto</h2>
                            <p className="text-indigo-200 mb-6 text-sm leading-relaxed">
                                Si tienes dudas sobre tu orden, contáctanos directamente.
                            </p>

                            <div className="space-y-4">
                                {orden.empresa?.telefono && (
                                    <a
                                        href={`tel:${orden.empresa.telefono}`}
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Phone className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-indigo-300 uppercase">Llámanos</p>
                                            <p className="text-white font-medium">{orden.empresa.telefono}</p>
                                        </div>
                                    </a>
                                )}
                                {orden.empresa?.direccion && (
                                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-indigo-300 uppercase">Visítanos</p>
                                            <p className="text-white text-sm">{orden.empresa.direccion}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-indigo-100 bg-white/50 backdrop-blur-sm mt-12 py-8">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Powered by <span className="text-indigo-600 font-bold">RepairApp</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        Sistema de Gestión de Servicio Técnico
                    </p>
                </div>
            </footer>
        </div>
    )
}
