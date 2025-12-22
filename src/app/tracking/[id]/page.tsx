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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white">RepairApp</span>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-slate-400">
                        Seguimiento
                    </Badge>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Order Header */}
                <Card className="bg-white/5 border-white/10 mb-6 overflow-hidden">
                    <div className={`h-2 ${estado.bgColor}`} />
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Orden de Servicio</p>
                                <h1 className="text-2xl font-bold text-white">{orden.numero}</h1>
                                <p className="text-slate-400 mt-1">{orden.empresa?.nombre}</p>
                            </div>
                            <div className="text-right">
                                <Badge className={`${estado.bgColor} border-0 text-white gap-1 px-4 py-2`}>
                                    <EstadoIcon className="h-4 w-4" />
                                    {estado.label}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Steps */}
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">Progreso</h2>
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
                            <div
                                className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                style={{ width: `${((currentStep - 1) / (allSteps.length - 1)) * 100}%` }}
                            />

                            {/* Steps */}
                            <div className="relative flex justify-between">
                                {allSteps.map((step, index) => {
                                    const stepConfig = estadoConfig[step]
                                    const isCompleted = index < currentStep - 1
                                    const isCurrent = index === currentStep - 1
                                    const StepIcon = stepConfig.icon

                                    return (
                                        <div key={step} className="flex flex-col items-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted || isCurrent
                                                    ? stepConfig.bgColor
                                                    : 'bg-slate-800 border-2 border-white/20'
                                                    }`}
                                            >
                                                <StepIcon className={`h-4 w-4 ${isCompleted || isCurrent ? 'text-white' : 'text-slate-500'}`} />
                                            </div>
                                            <p
                                                className={`text-xs mt-2 text-center max-w-[60px] ${isCurrent ? 'text-white font-medium' : 'text-slate-500'
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
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-400" />
                            Equipo en Servicio
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Equipo</p>
                                <p className="text-white font-medium">{orden.equipo_tipo}</p>
                            </div>
                            {orden.equipo_marca && (
                                <div>
                                    <p className="text-sm text-slate-500">Marca</p>
                                    <p className="text-white">{orden.equipo_marca}</p>
                                </div>
                            )}
                            {orden.equipo_modelo && (
                                <div>
                                    <p className="text-sm text-slate-500">Modelo</p>
                                    <p className="text-white">{orden.equipo_modelo}</p>
                                </div>
                            )}
                            {orden.equipo_serie && (
                                <div>
                                    <p className="text-sm text-slate-500">N° Serie</p>
                                    <p className="text-white font-mono">{orden.equipo_serie}</p>
                                </div>
                            )}
                        </div>

                        {orden.problema_reportado && (
                            <>
                                <Separator className="bg-white/10 my-4" />
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Problema reportado</p>
                                    <p className="text-slate-300">{orden.problema_reportado}</p>
                                </div>
                            </>
                        )}

                        {orden.diagnostico && (
                            <>
                                <Separator className="bg-white/10 my-4" />
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Diagnóstico</p>
                                    <p className="text-slate-300">{orden.diagnostico}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Costs (if available) */}
                {(orden.costo_estimado || orden.costo_final) && (
                    <Card className="bg-white/5 border-white/10 mb-6">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Costos</h2>
                            <div className="flex justify-between items-center">
                                {orden.costo_estimado && (
                                    <div>
                                        <p className="text-sm text-slate-500">Costo Estimado</p>
                                        <p className="text-xl text-white">${orden.costo_estimado.toFixed(2)}</p>
                                    </div>
                                )}
                                {orden.costo_final && (
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Costo Final</p>
                                        <p className="text-2xl font-bold text-emerald-400">${orden.costo_final.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Dates & Info */}
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-500" />
                                <div>
                                    <p className="text-sm text-slate-500">Fecha de ingreso</p>
                                    <p className="text-white">{formatDate(orden.created_at)}</p>
                                </div>
                            </div>
                            {orden.tecnico && (
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <p className="text-sm text-slate-500">Técnico asignado</p>
                                        <p className="text-white">{orden.tecnico.nombre}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">¿Tienes preguntas?</h2>
                        <p className="text-slate-300 mb-4">
                            Comunícate con {orden.empresa?.nombre || 'nosotros'} para más información sobre tu equipo.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {orden.empresa?.telefono && (
                                <a
                                    href={`tel:${orden.empresa.telefono}`}
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                                >
                                    <Phone className="h-4 w-4" />
                                    {orden.empresa.telefono}
                                </a>
                            )}
                            {orden.empresa?.direccion && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin className="h-4 w-4" />
                                    {orden.empresa.direccion}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-6 mt-12">
                <div className="max-w-3xl mx-auto px-4 text-center text-sm text-slate-500">
                    Powered by RepairApp · Sistema de Servicio Técnico
                </div>
            </footer>
        </div>
    )
}
