'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { generateOrderQR } from '@/lib/qr-generator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Wrench,
    User,
    Package,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Search,
    Edit,
    Save,
    Download,
    QrCode,
    ExternalLink,
    Loader2,
    Phone,
    Mail,
    DollarSign,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PDFDownloadButton } from '@/components/pdf/pdf-download-wrapper'

interface OrdenServicio {
    id: string
    numero_orden: string
    equipo: string
    marca: string | null
    modelo: string | null
    serie: string | null
    accesorios: string | null
    problema_reportado: string | null
    diagnostico: string | null
    observaciones_recepcion: string | null
    estado: string
    prioridad: string
    costo_estimado: number | null
    costo_final: number | null
    created_at: string
    updated_at: string
    cliente: {
        id: string
        nombre: string
        identificacion: string
        telefono: string | null
        email: string | null
        direccion: string | null
    } | null
    tecnico: {
        id: string
        nombre: string
    } | null
    empresa: {
        nombre: string
        ruc: string
        direccion: string | null
        telefono: string | null
        email: string | null
    }
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    recibido: { label: 'Recibido', color: 'text-slate-400', bgColor: 'bg-slate-500', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: Search },
    cotizado: { label: 'Cotizado', color: 'text-amber-400', bgColor: 'bg-amber-500', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'text-cyan-400', bgColor: 'bg-cyan-500', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'text-violet-400', bgColor: 'bg-violet-500', icon: Wrench },
    terminado: { label: 'Terminado', color: 'text-emerald-400', bgColor: 'bg-emerald-500', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'text-green-400', bgColor: 'bg-green-500', icon: CheckCircle },
}

const estados = Object.keys(estadoConfig)

export default function OrdenDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuthStore()
    const [orden, setOrden] = useState<OrdenServicio | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
    const [qrData, setQRData] = useState<{ qrDataUrl: string; trackingUrl: string } | null>(null)

    // Edit form
    const [formData, setFormData] = useState({
        estado: '',
        diagnostico: '',
        costo_estimado: '',
        costo_final: '',
    })

    const supabase = createClient()
    const ordenId = params.id as string

    useEffect(() => {
        loadOrden()
    }, [ordenId])

    const loadOrden = async () => {
        if (!ordenId) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('ordenes_servicio')
                .select(`
          *,
          cliente:clientes(*),
          tecnico:usuarios!ordenes_servicio_tecnico_id_fkey(id, nombre),
          empresa:empresas(nombre, ruc, direccion, telefono, email)
        `)
                .eq('id', ordenId)
                .single()

            if (error) throw error
            setOrden(data)
            setFormData({
                estado: data.estado,
                diagnostico: data.diagnostico || '',
                costo_estimado: data.costo_estimado?.toString() || '',
                costo_final: data.costo_final?.toString() || '',
            })
        } catch (error: any) {
            toast.error('Error al cargar orden', { description: error.message })
            router.push('/ordenes')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!orden) return

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('ordenes_servicio')
                .update({
                    estado: formData.estado,
                    diagnostico: formData.diagnostico || null,
                    costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
                    costo_final: formData.costo_final ? parseFloat(formData.costo_final) : null,
                })
                .eq('id', orden.id)

            if (error) throw error

            toast.success('Orden actualizada')
            setIsEditing(false)
            loadOrden()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleGenerateQR = async () => {
        if (!orden) return

        try {
            const data = await generateOrderQR(orden.id)
            setQRData(data)
            setIsQRDialogOpen(true)
        } catch (error) {
            toast.error('Error al generar QR')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64 bg-white/10" />
                <Skeleton className="h-48 w-full bg-white/10" />
                <Skeleton className="h-64 w-full bg-white/10" />
            </div>
        )
    }

    if (!orden) return null

    const estado = estadoConfig[orden.estado] || estadoConfig.recibido
    const EstadoIcon = estado.icon

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/ordenes">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            Orden {orden.numero_orden}
                            <Badge className={`${estado.bgColor} border-0 text-white gap-1`}>
                                <EstadoIcon className="h-3 w-3" />
                                {estado.label}
                            </Badge>
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Creada el {format(new Date(orden.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <PDFDownloadButton
                        orden={{
                            ...orden,
                            problema: orden.problema_reportado
                        }}
                        qrCodeUrl={qrData?.qrDataUrl || ''}
                        trackingUrl={typeof window !== 'undefined' ? `${window.location.origin}/tracking/${orden.id}` : ''}
                        fileName={`Orden-${orden.numero_orden}.pdf`}
                    >
                        Descargar PDF
                    </PDFDownloadButton>

                    <Button
                        variant="outline"
                        onClick={handleGenerateQR}
                        className="gap-2 border-white/10 text-white hover:bg-white/5"
                    >
                        <QrCode className="h-4 w-4" />
                        Ver QR
                    </Button>

                    <PermissionGate permission="orders.update">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="border-white/10 text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 gap-2"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600"
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        )}
                    </PermissionGate>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Equipment */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-400" />
                                Equipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Equipo</p>
                                    <p className="text-white font-medium">{orden.equipo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Marca</p>
                                    <p className="text-white">{orden.marca || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Modelo</p>
                                    <p className="text-white">{orden.modelo || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">N° Serie</p>
                                    <p className="text-white font-mono">{orden.serie || '-'}</p>
                                </div>
                            </div>
                            {orden.accesorios && (
                                <div>
                                    <p className="text-sm text-slate-500">Accesorios</p>
                                    <p className="text-white">{orden.accesorios}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Problem & Diagnosis */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-400" />
                                Detalle del Servicio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Problema Reportado</p>
                                <p className="text-slate-300">{orden.problema_reportado || 'No especificado'}</p>
                            </div>

                            <Separator className="bg-white/10" />

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Estado</Label>
                                        <Select
                                            value={formData.estado}
                                            onValueChange={(v) => setFormData(f => ({ ...f, estado: v }))}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-white/10">
                                                {estados.map(e => (
                                                    <SelectItem key={e} value={e} className="text-white">
                                                        {estadoConfig[e].label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Diagnóstico</Label>
                                        <Textarea
                                            value={formData.diagnostico}
                                            onChange={(e) => setFormData(f => ({ ...f, diagnostico: e.target.value }))}
                                            className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                            placeholder="Describe el diagnóstico del equipo..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Costo Estimado</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.costo_estimado}
                                                onChange={(e) => setFormData(f => ({ ...f, costo_estimado: e.target.value }))}
                                                className="bg-white/5 border-white/10 text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Costo Final</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.costo_final}
                                                onChange={(e) => setFormData(f => ({ ...f, costo_final: e.target.value }))}
                                                className="bg-white/5 border-white/10 text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Diagnóstico</p>
                                        <p className="text-slate-300">{orden.diagnostico || 'Pendiente de diagnóstico'}</p>
                                    </div>

                                    {(orden.costo_estimado || orden.costo_final) && (
                                        <>
                                            <Separator className="bg-white/10" />
                                            <div className="flex gap-6">
                                                {orden.costo_estimado && (
                                                    <div>
                                                        <p className="text-sm text-slate-500">Costo Estimado</p>
                                                        <p className="text-xl text-white">${orden.costo_estimado.toFixed(2)}</p>
                                                    </div>
                                                )}
                                                {orden.costo_final && (
                                                    <div>
                                                        <p className="text-sm text-slate-500">Costo Final</p>
                                                        <p className="text-xl font-bold text-emerald-400">${orden.costo_final.toFixed(2)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Cliente */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-400" />
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {orden.cliente ? (
                                <>
                                    <p className="text-white font-medium">{orden.cliente.nombre}</p>
                                    <p className="text-slate-400 text-sm">{orden.cliente.identificacion}</p>
                                    {orden.cliente.telefono && (
                                        <a
                                            href={`tel:${orden.cliente.telefono}`}
                                            className="flex items-center gap-2 text-blue-400 hover:underline text-sm"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {orden.cliente.telefono}
                                        </a>
                                    )}
                                    {orden.cliente.email && (
                                        <a
                                            href={`mailto:${orden.cliente.email}`}
                                            className="flex items-center gap-2 text-blue-400 hover:underline text-sm"
                                        >
                                            <Mail className="h-4 w-4" />
                                            {orden.cliente.email}
                                        </a>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-400">Sin cliente asignado</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Técnico */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-emerald-400" />
                                Técnico
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orden.tecnico ? (
                                <p className="text-white">{orden.tecnico.nombre}</p>
                            ) : (
                                <p className="text-slate-400">Sin asignar</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Acciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <a
                                href={`/tracking/${orden.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 border-white/10 text-white hover:bg-white/5"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver Portal Cliente
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* QR Dialog */}
            <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Código QR de Seguimiento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-6">
                        {qrData && (
                            <>
                                <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48" />
                                <p className="text-slate-400 text-sm mt-4 text-center">
                                    El cliente puede escanear este código para ver el estado de su orden
                                </p>
                                <p className="text-xs text-blue-400 mt-2 break-all text-center">
                                    {qrData.trackingUrl}
                                </p>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsQRDialogOpen(false)} className="w-full">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
