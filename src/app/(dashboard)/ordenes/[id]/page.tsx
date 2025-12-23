'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { useTenant } from '@/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    FileText,
    Save,
    User,
    Wrench,
    AlertTriangle,
    Edit,
    Phone,
    Mail,
    QrCode,
    Search,
    Package,
    ExternalLink,

    Loader2,
    DollarSign,
    ShoppingCart,
    Trash2,
    Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/hooks/use-permissions'
import { generateOrderQR } from '@/lib/qr-generator'

// Import PDFDownloadButton dynamically
const PDFDownloadButton = dynamic(
    () => import('@/components/pdf/pdf-download-wrapper').then(mod => mod.PDFDownloadButton),
    { ssr: false }
)

interface OrdenServicio {
    id: string
    numero: string
    equipo_tipo: string
    equipo_marca: string | null
    equipo_modelo: string | null
    equipo_serie: string | null
    accesorios: string | null
    problema_reportado: string | null
    diagnostico: string | null
    observaciones_recepcion: string | null
    estado: string
    prioridad: string
    costo_estimado: number | null
    costo_final: number | null
    created_at: string
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
    mano_obra: number | null
    repuestos: {
        id: string
        cantidad: number
        precio_unitario: number
        subtotal: number
        producto: {
            nombre: string
            codigo: string
        }
    }[]
    pagos: {
        id: string
        monto: number
        metodo: string
        fecha: string
        nota: string | null
        referencia: string | null
        registrado_por: { nombre: string } | null
    }[]
    estado_pago?: string
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    recibido: { label: 'Recibido', color: 'text-slate-700', bgColor: 'bg-slate-100 border-slate-200', icon: Clock },
    en_diagnostico: { label: 'En Diagnóstico', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', icon: Search },
    cotizado: { label: 'Cotizado', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-200', icon: AlertTriangle },
    aprobado: { label: 'Aprobado', color: 'text-cyan-700', bgColor: 'bg-cyan-100 border-cyan-200', icon: CheckCircle },
    en_reparacion: { label: 'En Reparación', color: 'text-violet-700', bgColor: 'bg-violet-100 border-violet-200', icon: Wrench },
    terminado: { label: 'Terminado', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', icon: CheckCircle },
    entregado: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100 border-green-200', icon: CheckCircle },
}

const estados = Object.keys(estadoConfig)

export default function OrdenDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuthStore()
    const { empresa } = useTenant()
    const [orden, setOrden] = useState<OrdenServicio | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
    const [qrData, setQRData] = useState<{ qrDataUrl: string; trackingUrl: string } | null>(null)

    // Payments State
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ monto: '', metodo: 'efectivo', nota: '', referencia: '' })
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

    // Repuestos Editing State
    const [repuestos, setRepuestos] = useState<{ id: string; nombre: string; precio: number; cantidad: number }[]>([])
    const [productoSearch, setProductoSearch] = useState('')
    const [productosList, setProductosList] = useState<any[]>([])
    const [showProductoDropdown, setShowProductoDropdown] = useState(false)
    const [manoObra, setManoObra] = useState(0)

    // Edit form
    const [formData, setFormData] = useState({
        estado: '',
        diagnostico: '',
        costo_estimado: '', // Will be used for fallback/manual override if needed
        costo_final: '', // Will be calculated
    })

    const ordenId = params.id as string

    const loadOrden = useCallback(async () => {
        if (!ordenId) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/ordenes/${ordenId}`)

            if (!response.ok) {
                throw new Error('Orden no encontrada')
            }

            const data = await response.json()
            setOrden(data)
            setFormData({
                estado: data.estado,
                diagnostico: data.diagnostico || '',
                costo_estimado: data.costo_estimado?.toString() || '',
                costo_final: data.costo_final?.toString() || '',
            })
            // Populate Repuestos State
            if (data.repuestos) {
                setRepuestos(data.repuestos.map((r: any) => ({
                    id: r.producto.id || r.producto_id, // Safety check
                    nombre: r.producto.nombre,
                    precio: Number(r.precio_unitario),
                    cantidad: r.cantidad
                })))
            }
            setManoObra(Number(data.mano_obra) || 0)

            // Auto-generate QR for PDF - silently, no dialog
            try {
                const qr = await generateOrderQR(data.id || ordenId)
                setQRData(qr)
            } catch (e) {
                console.warn('Could not pre-generate QR:', e)
            }
        } catch (error: any) {
            toast.error('Error al cargar orden', { description: error.message })
            router.push('/ordenes')
        } finally {
            setIsLoading(false)
        }
    }, [ordenId, router])

    useEffect(() => {
        loadOrden()
    }, [loadOrden])

    // Search Productos Logic (Adapted from Create Page)
    useEffect(() => {
        const searchProductos = async () => {
            if (!user?.empresa_id || productoSearch.length < 2) {
                setProductosList([])
                return
            }
            try {
                const response = await fetch(`/api/productos?empresa_id=${user.empresa_id}&search=${encodeURIComponent(productoSearch)}&activo=true`)
                if (response.ok) {
                    const data = await response.json()
                    setProductosList(data || [])
                }
            } catch (error) {
                console.error('Error searching productos:', error)
            }
        }
        const debounce = setTimeout(searchProductos, 300)
        return () => clearTimeout(debounce)
    }, [productoSearch, user?.empresa_id])

    const addRepuesto = (producto: any) => {
        setRepuestos(prev => {
            const exists = prev.find(p => p.id === producto.id)
            if (exists) {
                return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p)
            }
            return [...prev, { id: producto.id, nombre: producto.nombre, precio: Number(producto.precio_venta), cantidad: 1 }]
        })
        setProductoSearch('')
        setShowProductoDropdown(false)
        toast.success(`Agregado: ${producto.nombre}`)
    }

    const removeRepuesto = (id: string) => {
        setRepuestos(prev => prev.filter(p => p.id !== id))
    }

    const handleSave = async () => {
        if (!orden) return

        setIsSaving(true)
        try {
            const response = await fetch(`/api/ordenes/${orden.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: formData.estado,
                    diagnostico: formData.diagnostico || null,
                    // Send updated costs and parts
                    mano_obra: manoObra,
                    repuestos: repuestos.map(r => ({
                        producto_id: r.id,
                        cantidad: r.cantidad,
                        precio_unitario: r.precio
                    })),
                    // cost calculated in backend usually, but we can send if needed.
                    // Backend will recalculate total based on parts + MO.
                })
            })

            if (!response.ok) {
                throw new Error('Error al guardar')
            }

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

    const handleRegistrarPago = async () => {
        if (!orden || !paymentForm.monto) {
            toast.error('Ingrese un monto')
            return
        }

        setIsSubmittingPayment(true)
        try {
            const response = await fetch('/api/pagos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa_id: empresa?.id, // Should come from user store or tenant hook
                    orden_id: orden.id,
                    monto: paymentForm.monto,
                    metodo: paymentForm.metodo,
                    nota: paymentForm.nota,
                    referencia: paymentForm.referencia,
                    registrado_por_id: user?.id
                })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Error al registrar pago')
            }

            toast.success('Pago registrado exitosamente')
            setIsPaymentDialogOpen(false)
            setPaymentForm({ monto: '', metodo: 'efectivo', nota: '', referencia: '' }) // Reset
            loadOrden() // Reload to see update
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    // Calculations
    const totalPagado = orden?.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0
    const costoFinalCalc = (Number(orden?.mano_obra || 0) + (orden?.repuestos?.reduce((acc, r) => acc + Number(r.subtotal), 0) || 0))
    // Use stored costo_final if available, else calculated
    const finalAmount = Number(orden?.costo_final) > 0 ? Number(orden?.costo_final) : costoFinalCalc
    const saldoPendiente = finalAmount - totalPagado

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64 bg-gray-100" />
                <Skeleton className="h-48 w-full bg-gray-100" />
                <Skeleton className="h-64 w-full bg-gray-100" />
            </div>
        )
    }

    if (!orden) return null

    const estado = estadoConfig[orden.estado] || estadoConfig.recibido
    const EstadoIcon = estado.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/ordenes">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Orden {orden.numero}
                            </h1>
                            <Badge className={`${estado.bgColor} ${estado.color} border gap-1.5 px-3 py-1 text-sm shadow-sm`}>
                                <EstadoIcon className="h-3.5 w-3.5" />
                                {estado.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Creada el {format(new Date(orden.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <PDFDownloadButton
                        orden={{
                            ...orden,
                            numero_orden: orden.numero,
                            equipo: orden.equipo_tipo,
                            marca: orden.equipo_marca,
                            modelo: orden.equipo_modelo,
                            serie: orden.equipo_serie,
                            problema: orden.problema_reportado,
                            cliente: orden.cliente || null,
                            empresa: {
                                nombre: empresa?.nombre || 'Empresa',
                                ruc: empresa?.ruc || '',
                                direccion: empresa?.direccion || null,
                                telefono: empresa?.telefono || null,
                                email: empresa?.email || null,
                            }
                        }}
                        qrCodeUrl={qrData?.qrDataUrl || ''}
                        trackingUrl={typeof window !== 'undefined' ? `${window.location.origin}/tracking/${orden.id}` : ''}
                        fileName={`Orden-${orden.numero}.pdf`}
                        className="bg-white/50 border-gray-200 text-gray-700 hover:bg-white hover:text-blue-600 shadow-sm"
                    >
                        Descargar PDF
                    </PDFDownloadButton>

                    <Button
                        variant="outline"
                        onClick={handleGenerateQR}
                        className="gap-2 bg-white/50 border-gray-200 text-gray-700 hover:bg-white hover:text-blue-600 shadow-sm"
                    >
                        <QrCode className="h-4 w-4" />
                        <span className="hidden sm:inline">QR</span>
                    </Button>

                    <PermissionGate permission="orders.update">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="border-gray-200 bg-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 gap-2"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Guardar
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-all"
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
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-500" />
                                Equipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Equipo</p>
                                    <p className="text-gray-900 font-medium">{orden.equipo_tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Marca</p>
                                    <p className="text-gray-900">{orden.equipo_marca || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Modelo</p>
                                    <p className="text-gray-900">{orden.equipo_modelo || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">N° Serie</p>
                                    <p className="text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded-md inline-block text-sm">
                                        {orden.equipo_serie || '-'}
                                    </p>
                                </div>
                            </div>
                            {orden.accesorios && (
                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Accesorios</p>
                                    <p className="text-gray-700 text-sm">{orden.accesorios}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Problem & Diagnosis */}
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-500" />
                                Detalle del Servicio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Problema Reportado</p>
                                <div className="bg-amber-50/30 p-4 rounded-lg border border-amber-100/50">
                                    <p className="text-gray-800">{orden.problema_reportado || 'No especificado'}</p>
                                </div>
                            </div>

                            <Separator className="bg-gray-100" />

                            {isEditing ? (
                                <div className="space-y-5 bg-white p-4 rounded-xl border border-blue-100 shadow-inner">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Estado</Label>
                                        <Select
                                            value={formData.estado}
                                            onValueChange={(v) => setFormData(f => ({ ...f, estado: v }))}
                                        >
                                            <SelectTrigger className="bg-white border-gray-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {estados.map(e => (
                                                    <SelectItem key={e} value={e}>
                                                        {estadoConfig[e].label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Diagnóstico Técnico</Label>
                                        <Textarea
                                            value={formData.diagnostico}
                                            onChange={(e) => setFormData(f => ({ ...f, diagnostico: e.target.value }))}
                                            className="bg-white border-gray-200 min-h-[120px] focus:ring-blue-500/20"
                                            placeholder="Detalla el diagnóstico técnico y los pasos a seguir..."
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-gray-100">
                                        <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-600" />
                                            Costos y Repuestos
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-700">Mano de Obra ($)</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={manoObra}
                                                    onChange={(e) => setManoObra(parseFloat(e.target.value) || 0)}
                                                    className="bg-white border-gray-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-700">Total Calculado</Label>
                                                <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md font-bold text-gray-800">
                                                    ${(manoObra + repuestos.reduce((acc, r) => acc + (r.precio * r.cantidad), 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Repuestos Selector */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 text-sm">Agregar Repuestos</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                <Input
                                                    placeholder="Buscar repuesto..."
                                                    value={productoSearch}
                                                    onChange={(e) => {
                                                        setProductoSearch(e.target.value)
                                                        setShowProductoDropdown(true)
                                                    }}
                                                    onFocus={() => setShowProductoDropdown(true)}
                                                    className="pl-9 bg-white border-gray-200 h-9 text-sm"
                                                />
                                                {showProductoDropdown && productosList.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                                                        {productosList.map(prod => (
                                                            <button
                                                                key={prod.id}
                                                                type="button"
                                                                className="w-full p-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50 flex justify-between items-center text-sm"
                                                                onClick={() => addRepuesto(prod)}
                                                            >
                                                                <span className="font-medium text-gray-800">{prod.nombre}</span>
                                                                <span className="font-bold text-emerald-600">${prod.precio_venta}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lista Repuestos Editing */}
                                        {repuestos.length > 0 && (
                                            <div className="space-y-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                                {repuestos.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-white shadow-sm rounded border border-gray-100">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-800">{item.nombre}</span>
                                                            <div className="text-xs text-gray-500 flex gap-2">
                                                                <span>${item.precio.toFixed(2)}</span>
                                                                <span>x {item.cantidad}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">${(item.cantidad * item.precio).toFixed(2)}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeRepuesto(item.id)}
                                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Diagnóstico Técnico</p>
                                        {orden.diagnostico ? (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800 whitespace-pre-wrap">
                                                {orden.diagnostico}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground italic pl-2 border-l-2 border-gray-200">Pendiente de diagnóstico</p>
                                        )}
                                    </div>


                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Desglose de Costos (NEW) */}
                    {(orden.repuestos.length > 0 || (orden.mano_obra && orden.mano_obra > 0)) && (
                        <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-100/50">
                                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                    Desglose de Costos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-3">
                                    {/* Mano de Obra */}
                                    {orden.mano_obra && Number(orden.mano_obra) > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                                                    <Wrench className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-gray-700">Mano de Obra</span>
                                            </div>
                                            <span className="font-bold text-gray-900">${Number(orden.mano_obra).toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* Repuestos */}
                                    {orden.repuestos.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">Repuestos y Materiales</p>
                                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                                {orden.repuestos.map((rep) => (
                                                    <div key={rep.id} className="flex justify-between items-center p-3 bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-800">{rep.producto.nombre}</span>
                                                            <span className="text-xs text-blue-600 font-mono tracking-tight">{rep.producto.codigo}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-gray-900">${Number(rep.subtotal).toFixed(2)}</div>
                                                            <div className="text-xs text-gray-500">{rep.cantidad} x ${Number(rep.precio_unitario).toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Separator className="bg-emerald-100/50 my-2" />

                                    {/* Totales */}
                                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                                        <span className="text-lg font-bold text-emerald-800">Costo Final Calculado</span>
                                        <span className="text-2xl font-bold text-emerald-700">
                                            ${(Number(orden.mano_obra || 0) + orden.repuestos.reduce((acc, r) => acc + Number(r.subtotal), 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div >

                {/* Historial de Pagos y Saldo */}
                {orden.costo_final && Number(orden.costo_final) > 0 && (
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                Pagos y Abonos
                            </CardTitle>
                            {saldoPendiente > 0.01 && (
                                <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                    <Plus className="h-4 w-4" />
                                    Registrar Pago
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Resumen Saldo */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-500 mb-1">Costo Total</p>
                                    <p className="text-2xl font-bold text-gray-900">${finalAmount.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <p className="text-sm text-green-600 mb-1">Abonado</p>
                                    <p className="text-2xl font-bold text-green-700">${totalPagado.toFixed(2)}</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${saldoPendiente > 0.01 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <p className={`text-sm mb-1 ${saldoPendiente > 0.01 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {saldoPendiente > 0.01 ? 'Saldo Pendiente' : 'Estado'}
                                    </p>
                                    <p className={`text-2xl font-bold ${saldoPendiente > 0.01 ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {saldoPendiente > 0.01 ? `$${saldoPendiente.toFixed(2)}` : '¡Pagado!'}
                                    </p>
                                </div>
                            </div>

                            {/* Lista de Pagos */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Historial</h4>
                                {orden.pagos && orden.pagos.length > 0 ? (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                                        {orden.pagos.map((pago: any) => (
                                            <div key={pago.id} className="p-3 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div>
                                                    <p className="font-bold text-gray-800">${Number(pago.monto).toFixed(2)} <span className="text-xs font-normal text-gray-500">via {pago.metodo}</span></p>
                                                    <p className="text-xs text-gray-400">
                                                        {format(new Date(pago.fecha), "dd MMM yyyy HH:mm", { locale: es })}
                                                        {pago.registrado_por && ` • por ${pago.registrado_por.nombre}`}
                                                    </p>
                                                    {pago.nota && <p className="text-xs text-blue-500 mt-0.5">Nota: {pago.nota}</p>}
                                                </div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Completado
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p className="text-muted-foreground text-sm">No hay pagos registrados aún.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
                < div className="space-y-6" >
                    {/* Cliente */}
                    < Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm" >
                        <CardHeader className="pb-3 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-500" />
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {orden.cliente ? (
                                <>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-lg">{orden.cliente.nombre}</p>
                                        <p className="text-muted-foreground text-sm font-mono">{orden.cliente.identificacion}</p>
                                    </div>

                                    <div className="space-y-2">
                                        {orden.cliente.telefono && (
                                            <a
                                                href={`tel:${orden.cliente.telefono}`}
                                                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg group"
                                            >
                                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full group-hover:bg-blue-200 transaction-colors">
                                                    <Phone className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-sm font-medium">{orden.cliente.telefono}</span>
                                            </a>
                                        )}
                                        {orden.cliente.email && (
                                            <a
                                                href={`mailto:${orden.cliente.email}`}
                                                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg group"
                                            >
                                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full group-hover:bg-blue-200 transaction-colors">
                                                    <Mail className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-sm font-medium truncate">{orden.cliente.email}</span>
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground italic">Sin cliente asignado</p>
                            )}
                        </CardContent>
                    </Card >

                    {/* Técnico */}
                    < Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm" >
                        <CardHeader className="pb-3 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-emerald-500" />
                                Técnico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {orden.tecnico ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-300 shadow-sm">
                                        <span className="font-bold text-gray-600 text-lg">
                                            {orden.tecnico.nombre.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{orden.tecnico.nombre}</p>
                                        <p className="text-xs text-muted-foreground">Responsable</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Sin asignar</p>
                            )}
                        </CardContent>
                    </Card >

                    {/* Quick Actions */}
                    < Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 border-0" >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-white/90">Portal del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-white/70 mb-4">
                                Accede o comparte el enlace de seguimiento público.
                            </p>
                            <a
                                href={`/tracking/${orden.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="secondary"
                                    className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver Portal Cliente
                                </Button>
                            </a>
                        </CardContent>
                    </Card >
                </div >
            </div >

            {/* QR Dialog */}
            < Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen} >
                <DialogContent className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-800">
                            <QrCode className="h-5 w-5 text-blue-600" />
                            Código QR de Seguimiento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-2">
                        {qrData && (
                            <>
                                <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-sm">
                                    <Image
                                        src={qrData.qrDataUrl}
                                        alt="QR Code"
                                        fill
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-gray-500 text-sm mt-4 text-center max-w-[200px]">
                                    El cliente puede escanear este código para ver el estado de su orden
                                </p>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsQRDialogOpen(false)} variant="outline" className="w-full">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>Registrar Pago / Abono</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Monto a Abonar ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                max={saldoPendiente}
                                value={paymentForm.monto}
                                onChange={e => setPaymentForm(prev => ({ ...prev, monto: e.target.value }))}
                                className="text-2xl font-bold text-green-700 placeholder:text-green-700/50"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 text-right">Saldo pendiente: ${saldoPendiente.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Método de Pago</Label>
                            <Select value={paymentForm.metodo} onValueChange={v => setPaymentForm(prev => ({ ...prev, metodo: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Referencia / Comprobante (Opcional)</Label>
                            <Input
                                value={paymentForm.referencia}
                                onChange={e => setPaymentForm(prev => ({ ...prev, referencia: e.target.value }))}
                                placeholder="Ej: N° Transacción 123456"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nota Interna</Label>
                            <Input
                                value={paymentForm.nota}
                                onChange={e => setPaymentForm(prev => ({ ...prev, nota: e.target.value }))}
                                placeholder="Ej: Pago parcial acordado..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRegistrarPago} disabled={isSubmittingPayment} className="bg-green-600 hover:bg-green-700 text-white">
                            {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Pago'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div >
    )
}
