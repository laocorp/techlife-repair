'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { InvoiceDownloadButton } from '@/components/pdf/invoice-download-wrapper'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
    FileText,
    Plus,
    Search,
    Download,
    Send,
    CheckCircle,
    Clock,
    AlertTriangle,
    XCircle,
    Settings,
    Eye,
    RefreshCw,
    Receipt,
    FileCheck,
    Building2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Factura {
    id: string
    numero: string
    tipo_comprobante: string
    cliente_nombre: string
    cliente_identificacion: string
    subtotal: number
    iva: number
    total: number
    estado: 'pendiente' | 'autorizado' | 'rechazado' | 'anulado' | 'devuelta'
    clave_acceso: string | null
    numero_autorizacion: string | null
    created_at: string
}

interface ConfiguracionSRI {
    ruc: string
    razon_social: string
    nombre_comercial: string
    direccion_matriz: string
    secuencial_factura: number
    punto_emision: string
    establecimiento: string
    ambiente: 'pruebas' | 'produccion'
    tipo_emision: 'normal' | 'contingencia'
}

const estadoConfig = {
    pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Clock },
    autorizado: { label: 'Autorizado', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', icon: CheckCircle },
    rechazado: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: XCircle },
    anulado: { label: 'Anulado', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', icon: AlertTriangle },
    devuelta: { label: 'Devuelta SRI', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', icon: AlertTriangle },
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function FacturacionPage() {
    const { user } = useAuthStore()
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('facturas')
    const [isConfigOpen, setIsConfigOpen] = useState(false)

    const [config, setConfig] = useState<ConfiguracionSRI>({
        ruc: '',
        razon_social: '',
        nombre_comercial: '',
        direccion_matriz: '',
        secuencial_factura: 1,
        punto_emision: '001',
        establecimiento: '001',
        ambiente: 'pruebas',
        tipo_emision: 'normal',
    })

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/facturacion?empresa_id=${user.empresa_id}`)
            if (!response.ok) throw new Error('Error loading data')

            const data = await response.json()
            setFacturas(data.facturas || [])

            if (data.empresa) {
                setConfig(prev => ({
                    ...prev,
                    ruc: data.empresa.ruc || '',
                    razon_social: data.empresa.nombre || '',
                    direccion_matriz: data.empresa.direccion || '',
                    ambiente: data.empresa.ambiente_sri || 'pruebas',
                    establecimiento: data.empresa.establecimiento || '001',
                    punto_emision: data.empresa.punto_emision || '001'
                }))
            }
        } catch (error: any) {
            console.error('Error loading data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredFacturas = facturas.filter(f =>
        f.numero.includes(searchQuery) ||
        f.cliente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.cliente_identificacion.includes(searchQuery)
    )

    // Stats
    const autorizadas = facturas.filter(f => f.estado === 'autorizado').length
    const pendientes = facturas.filter(f => f.estado === 'pendiente').length
    const totalFacturado = facturas.filter(f => f.estado === 'autorizado').reduce((acc, f) => acc + Number(f.total), 0)

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Facturación Electrónica
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Emisión y control de comprobantes SRI
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsConfigOpen(true)}
                        className="gap-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                    >
                        <Settings className="h-4 w-4" />
                        Configuración
                    </Button>
                    <PermissionGate permission="facturacion.crear">
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Factura
                        </Button>
                    </PermissionGate>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Total Facturas</p>
                            <p className="text-2xl font-bold text-gray-800">{facturas.length}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Autorizadas</p>
                            <p className="text-2xl font-bold text-emerald-600">{autorizadas}</p>
                        </div>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Pendientes</p>
                            <p className="text-2xl font-bold text-amber-500">{pendientes}</p>
                        </div>
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Total Facturado</p>
                            <p className="text-2xl font-bold text-indigo-600">${totalFacturado.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Receipt className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Ambiente Badge */}
            <motion.div variants={itemVariants}>
                <Card className={`bg-white/60 backdrop-blur-xl border shadow-sm ${config.ambiente === 'pruebas' ? 'border-amber-200' : 'border-emerald-200'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{config.razon_social || 'Configurar Empresa'}</p>
                                <p className="text-sm text-muted-foreground">RUC: {config.ruc || 'No configurado'}</p>
                            </div>
                        </div>
                        <Badge className={`${config.ambiente === 'pruebas' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} px-3 py-1 text-sm font-medium border-0`}>
                            {config.ambiente === 'pruebas' ? '🧪 Ambiente Pruebas' : '✅ Producción'}
                        </Badge>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search & Tabs */}
            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden">
                    <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número, cliente o RUC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white border-gray-200 focus:bg-white focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={loadData}
                                className="hover:bg-gray-100 text-gray-500"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="w-full justify-start border-b border-gray-100 rounded-none bg-transparent p-0 h-auto">
                                <TabsTrigger
                                    value="facturas"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-gray-500 px-6 py-3 font-medium transition-all"
                                >
                                    Facturas
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notas-credito"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-gray-500 px-6 py-3 font-medium transition-all"
                                >
                                    Notas de Crédito
                                </TabsTrigger>
                                <TabsTrigger
                                    value="retenciones"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 text-gray-500 px-6 py-3 font-medium transition-all"
                                >
                                    Retenciones
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="facturas" className="m-0">
                                {isLoading ? (
                                    <div className="p-6 space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full bg-gray-100 rounded-lg" />
                                        ))}
                                    </div>
                                ) : filteredFacturas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">No hay facturas</h3>
                                        <p className="text-muted-foreground mt-1 mb-6 max-w-sm">
                                            Aún no has emitido ninguna factura electrónica.
                                        </p>
                                        <PermissionGate permission="facturacion.crear">
                                            <Button className="bg-blue-600 text-white hover:bg-blue-700">
                                                Crear primera factura
                                            </Button>
                                        </PermissionGate>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredFacturas.map((factura) => {
                                            const estado = estadoConfig[factura.estado as keyof typeof estadoConfig] || estadoConfig['pendiente']
                                            const Icon = estado.icon || AlertTriangle
                                            return (
                                                <div key={factura.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-blue-50/50 transition-colors gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl ${estado.bgColor} flex items-center justify-center flex-shrink-0`}>
                                                            <Icon className={`h-6 w-6 ${estado.color}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {factura.numero}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <span className="font-medium">{factura.cliente_nombre}</span>
                                                                <span>•</span>
                                                                <span className="font-mono">{factura.cliente_identificacion}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6 justify-between md:justify-end">
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                ${Number(factura.total).toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(factura.created_at), "d MMM yyyy", { locale: es })}
                                                            </p>
                                                        </div>
                                                        <Badge className={`${estado.bgColor} ${estado.color} border ${estado.borderColor} px-3 py-1 shadow-sm`}>
                                                            {estado.label}
                                                        </Badge>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <InvoiceDownloadButton facturaId={factura.id} />
                                                            {factura.estado === 'pendiente' && (
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50">
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="notas-credito" className="m-0 py-16 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileCheck className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Notas de Crédito</h3>
                                <p className="text-muted-foreground mt-1">Próximamente disponible</p>
                            </TabsContent>

                            <TabsContent value="retenciones" className="m-0 py-16 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Receipt className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Retenciones</h3>
                                <p className="text-muted-foreground mt-1">Próximamente disponible</p>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Configuration Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Configuración SRI
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">RUC</Label>
                                <Input
                                    value={config.ruc}
                                    onChange={(e) => setConfig(c => ({ ...c, ruc: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    maxLength={13}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Razón Social</Label>
                                <Input
                                    value={config.razon_social}
                                    onChange={(e) => setConfig(c => ({ ...c, razon_social: e.target.value }))}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Nombre Comercial</Label>
                                <Input
                                    value={config.nombre_comercial}
                                    onChange={(e) => setConfig(c => ({ ...c, nombre_comercial: e.target.value }))}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Dirección Matriz</Label>
                                <Input
                                    value={config.direccion_matriz}
                                    onChange={(e) => setConfig(c => ({ ...c, direccion_matriz: e.target.value }))}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Establecimiento</Label>
                                <Input
                                    value={config.establecimiento}
                                    onChange={(e) => setConfig(c => ({ ...c, establecimiento: e.target.value }))}
                                    className="bg-white border-gray-200 font-mono"
                                    maxLength={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Punto de Emisión</Label>
                                <Input
                                    value={config.punto_emision}
                                    onChange={(e) => setConfig(c => ({ ...c, punto_emision: e.target.value }))}
                                    className="bg-white border-gray-200 font-mono"
                                    maxLength={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Ambiente</Label>
                                <Select value={config.ambiente} onValueChange={(v: any) => setConfig(c => ({ ...c, ambiente: v }))}>
                                    <SelectTrigger className="bg-white border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pruebas">🧪 Pruebas</SelectItem>
                                        <SelectItem value="produccion">✅ Producción</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-sm text-amber-600">
                                <AlertTriangle className="inline h-4 w-4 mr-1" />
                                <strong>Firma Electrónica:</strong> Para emitir comprobantes en producción,
                                necesitas configurar tu certificado .p12 en la sección de seguridad.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="border-gray-200 bg-white">
                            Cancelar
                        </Button>
                        <Button className="bg-blue-600 text-white hover:bg-blue-700">
                            Guardar Configuración
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
