// src/app/(dashboard)/facturacion/page.tsx
// Electronic invoicing module for Ecuador SRI

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'
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
    estado: 'pendiente' | 'autorizado' | 'rechazado' | 'anulado'
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
    pendiente: { label: 'Pendiente', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: Clock },
    autorizado: { label: 'Autorizado', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: CheckCircle },
    rechazado: { label: 'Rechazado', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: XCircle },
    anulado: { label: 'Anulado', color: 'text-slate-400', bgColor: 'bg-slate-500/10', icon: AlertTriangle },
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

    const supabase = createClient()

    useEffect(() => {
        loadFacturas()
        loadConfig()
    }, [user?.empresa_id])

    const loadFacturas = async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('facturacion_electronica')
                .select('*')
                .eq('empresa_id', user.empresa_id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setFacturas(data || [])
        } catch (error: any) {
            console.error('Error loading invoices:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadConfig = async () => {
        if (!user?.empresa_id) return

        try {
            const { data: empresa } = await supabase
                .from('empresas')
                .select('ruc, nombre, direccion, telefono')
                .eq('id', user.empresa_id)
                .single()

            if (empresa) {
                setConfig(prev => ({
                    ...prev,
                    ruc: empresa.ruc || '',
                    razon_social: empresa.nombre || '',
                    direccion_matriz: empresa.direccion || '',
                }))
            }
        } catch (error) {
            console.error('Error loading config:', error)
        }
    }

    const filteredFacturas = facturas.filter(f =>
        f.numero.includes(searchQuery) ||
        f.cliente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.cliente_identificacion.includes(searchQuery)
    )

    // Stats
    const autorizadas = facturas.filter(f => f.estado === 'autorizado').length
    const pendientes = facturas.filter(f => f.estado === 'pendiente').length
    const totalFacturado = facturas.filter(f => f.estado === 'autorizado').reduce((acc, f) => acc + f.total, 0)

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                        Facturación Electrónica
                    </h1>
                    <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                        Emisión de comprobantes electrónicos SRI
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsConfigOpen(true)}
                        className="gap-2 border-[hsl(var(--border-subtle))]"
                    >
                        <Settings className="h-4 w-4" />
                        Configuración
                    </Button>
                    <PermissionGate permission="facturacion.crear">
                        <Button
                            size="sm"
                            className="gap-2 bg-[hsl(var(--brand-accent))] hover:bg-[hsl(var(--brand-accent))]/90"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Factura
                        </Button>
                    </PermissionGate>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="stat-label">Total Facturas</p>
                                <p className="text-xl font-bold text-[hsl(var(--text-primary))]">{facturas.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="stat-label">Autorizadas</p>
                                <p className="text-xl font-bold text-emerald-400">{autorizadas}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="stat-label">Pendientes</p>
                                <p className="text-xl font-bold text-amber-400">{pendientes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <Receipt className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="stat-label">Total Facturado</p>
                                <p className="text-xl font-bold text-violet-400">${totalFacturado.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Ambiente Badge */}
            <motion.div variants={itemVariants}>
                <Card className={`card-linear ${config.ambiente === 'pruebas' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-[hsl(var(--text-muted))]" />
                            <div>
                                <p className="font-medium text-[hsl(var(--text-primary))]">{config.razon_social || 'Configurar Empresa'}</p>
                                <p className="text-sm text-[hsl(var(--text-muted))]">RUC: {config.ruc || 'No configurado'}</p>
                            </div>
                        </div>
                        <Badge className={config.ambiente === 'pruebas' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}>
                            {config.ambiente === 'pruebas' ? '🧪 Ambiente Pruebas' : '✅ Producción'}
                        </Badge>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search & Tabs */}
            <motion.div variants={itemVariants}>
                <Card className="card-linear">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-muted))]" />
                                <Input
                                    placeholder="Buscar por número, cliente o RUC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 input-linear"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadFacturas}
                                className="border-[hsl(var(--border-subtle))]"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="w-full justify-start border-b border-[hsl(var(--border-subtle))] rounded-none bg-transparent p-0 h-auto">
                                <TabsTrigger
                                    value="facturas"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand-accent))] data-[state=active]:bg-transparent px-4 py-3"
                                >
                                    Facturas
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notas-credito"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand-accent))] data-[state=active]:bg-transparent px-4 py-3"
                                >
                                    Notas de Crédito
                                </TabsTrigger>
                                <TabsTrigger
                                    value="retenciones"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--brand-accent))] data-[state=active]:bg-transparent px-4 py-3"
                                >
                                    Retenciones
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="facturas" className="m-0">
                                {isLoading ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full bg-[hsl(var(--surface-highlight))]" />
                                        ))}
                                    </div>
                                ) : filteredFacturas.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FileText className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                        <p className="text-[hsl(var(--text-secondary))]">No hay facturas</p>
                                        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                            Crea tu primera factura electrónica
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[hsl(var(--border-subtle))]">
                                        {filteredFacturas.map((factura) => {
                                            const estado = estadoConfig[factura.estado]
                                            const Icon = estado.icon
                                            return (
                                                <div key={factura.id} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--interactive-hover))] transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg ${estado.bgColor} flex items-center justify-center`}>
                                                            <Icon className={`h-5 w-5 ${estado.color}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[hsl(var(--text-primary))]">
                                                                {factura.numero}
                                                            </p>
                                                            <p className="text-xs text-[hsl(var(--text-muted))]">
                                                                {factura.cliente_nombre} · {factura.cliente_identificacion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold text-[hsl(var(--text-primary))]">
                                                                ${factura.total.toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-[hsl(var(--text-muted))]">
                                                                {format(new Date(factura.created_at), "d MMM yyyy", { locale: es })}
                                                            </p>
                                                        </div>
                                                        <Badge className={`${estado.bgColor} ${estado.color} border-0`}>
                                                            {estado.label}
                                                        </Badge>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {factura.estado === 'pendiente' && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400">
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

                            <TabsContent value="notas-credito" className="m-0 p-8 text-center">
                                <FileCheck className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                <p className="text-[hsl(var(--text-secondary))]">Notas de Crédito</p>
                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                    Próximamente disponible
                                </p>
                            </TabsContent>

                            <TabsContent value="retenciones" className="m-0 p-8 text-center">
                                <Receipt className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                <p className="text-[hsl(var(--text-secondary))]">Retenciones</p>
                                <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                    Próximamente disponible
                                </p>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Configuration Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[hsl(var(--text-primary))]">
                            Configuración SRI
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>RUC</Label>
                                <Input
                                    value={config.ruc}
                                    onChange={(e) => setConfig(c => ({ ...c, ruc: e.target.value }))}
                                    className="input-linear"
                                    maxLength={13}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Razón Social</Label>
                                <Input
                                    value={config.razon_social}
                                    onChange={(e) => setConfig(c => ({ ...c, razon_social: e.target.value }))}
                                    className="input-linear"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre Comercial</Label>
                                <Input
                                    value={config.nombre_comercial}
                                    onChange={(e) => setConfig(c => ({ ...c, nombre_comercial: e.target.value }))}
                                    className="input-linear"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Dirección Matriz</Label>
                                <Input
                                    value={config.direccion_matriz}
                                    onChange={(e) => setConfig(c => ({ ...c, direccion_matriz: e.target.value }))}
                                    className="input-linear"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Establecimiento</Label>
                                <Input
                                    value={config.establecimiento}
                                    onChange={(e) => setConfig(c => ({ ...c, establecimiento: e.target.value }))}
                                    className="input-linear"
                                    maxLength={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Punto de Emisión</Label>
                                <Input
                                    value={config.punto_emision}
                                    onChange={(e) => setConfig(c => ({ ...c, punto_emision: e.target.value }))}
                                    className="input-linear"
                                    maxLength={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ambiente</Label>
                                <Select value={config.ambiente} onValueChange={(v: any) => setConfig(c => ({ ...c, ambiente: v }))}>
                                    <SelectTrigger className="input-linear">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--border-subtle))]">
                                        <SelectItem value="pruebas">🧪 Pruebas</SelectItem>
                                        <SelectItem value="produccion">✅ Producción</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <p className="text-sm text-amber-400">
                                <AlertTriangle className="inline h-4 w-4 mr-1" />
                                <strong>Firma Electrónica:</strong> Para emitir comprobantes en producción,
                                necesitas configurar tu certificado .p12 en la sección de seguridad.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                            Cancelar
                        </Button>
                        <Button className="bg-[hsl(var(--brand-accent))]">
                            Guardar Configuración
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
