'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    ArrowLeft,
    Wrench,
    User,
    Package,
    FileText,
    Search,
    Loader2,
    Check,
    AlertCircle,
    Plus,
    Trash2,
    DollarSign,
} from 'lucide-react'

interface Cliente {
    id: string
    nombre: string
    identificacion: string
    telefono: string | null
    email: string | null
}

interface Usuario {
    id: string
    nombre: string
    rol: string
}

const marcas = ['Bosch', 'Emtop', 'Total', 'Sweiss', 'Esii', 'Growan', 'Dewalt', 'Makita', 'Otra']
const prioridades = [
    { value: 'baja', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { value: 'alta', label: 'Alta', color: 'bg-amber-100 text-amber-700' },
    { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
]

export default function NuevaOrdenPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [clienteSearch, setClienteSearch] = useState('')
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [tecnicos, setTecnicos] = useState<Usuario[]>([])
    const [showClienteDropdown, setShowClienteDropdown] = useState(false)

    const [formData, setFormData] = useState({
        cliente_id: '',
        clienteNombre: '',
        // Equipo
        equipo_tipo: '',
        equipo_marca: '',
        equipo_modelo: '',
        equipo_serie: '',
        accesorios: '',
        // Problema
        problema_reportado: '',
        observaciones: '',
        // Asignación
        tecnico_id: '',
        prioridad: 'normal',
    })

    // Repuestos & Costos State
    const [repuestos, setRepuestos] = useState<{ id: string; nombre: string; precio: number; cantidad: number }[]>([])
    const [productoSearch, setProductoSearch] = useState('')
    const [productosList, setProductosList] = useState<any[]>([])
    const [showProductoDropdown, setShowProductoDropdown] = useState(false)
    const [manoObra, setManoObra] = useState(0)

    // Calculate Total
    const totalEstimado = manoObra + repuestos.reduce((acc, r) => acc + (r.precio * r.cantidad), 0)


    // Load tecnicos
    const loadTecnicos = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const response = await fetch(`/api/usuarios?empresa_id=${user.empresa_id}&rol=admin,tecnico`)
            if (response.ok) {
                const data = await response.json()
                setTecnicos(data || [])
            }
        } catch (error) {
            console.error('Error loading tecnicos:', error)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadTecnicos()
    }, [loadTecnicos])

    // Search clientes
    useEffect(() => {
        const searchClientes = async () => {
            if (!user?.empresa_id || clienteSearch.length < 2) {
                setClientes([])
                return
            }

            try {
                const response = await fetch(`/api/clientes?empresa_id=${user.empresa_id}&search=${encodeURIComponent(clienteSearch)}`)
                if (response.ok) {
                    const data = await response.json()
                    setClientes(data || [])
                }
            } catch (error) {
                console.error('Error searching clientes:', error)
            }
        }

        const debounce = setTimeout(searchClientes, 300)
        return () => clearTimeout(debounce)
    }, [clienteSearch, user?.empresa_id])

    // Search Productos
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


    const handleSelectCliente = (cliente: Cliente) => {
        setFormData(f => ({ ...f, cliente_id: cliente.id, clienteNombre: cliente.nombre }))
        setClienteSearch(cliente.nombre)
        setShowClienteDropdown(false)
    }

    const handleSubmit = async () => {
        if (!formData.equipo_tipo) {
            toast.error('El tipo de equipo es requerido')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/ordenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa_id: user?.empresa_id,
                    cliente_id: formData.cliente_id || null,
                    tecnico_id: formData.tecnico_id || null,
                    creado_por_id: user?.id,
                    equipo_tipo: formData.equipo_tipo,
                    equipo_marca: formData.equipo_marca || null,
                    equipo_modelo: formData.equipo_modelo || null,
                    equipo_serie: formData.equipo_serie || null,
                    accesorios: formData.accesorios || null,
                    problema_reportado: formData.problema_reportado || null,
                    observaciones_recepcion: formData.observaciones || null,
                    prioridad: formData.prioridad,
                    estado: 'recibido',
                    mano_obra: manoObra,
                    repuestos: repuestos.map(r => ({
                        producto_id: r.id,
                        cantidad: r.cantidad,
                        precio_unitario: r.precio
                    })),
                    costo_estimado: totalEstimado > 0 ? totalEstimado : (formData.prioridad === 'urgente' ? 20 : 0) // Fallback or auto-calc
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al crear orden')
            }

            const data = await response.json()

            toast.success('Orden creada exitosamente', {
                description: `Número: ${data.numero}`,
            })

            router.push(`/ordenes/${data.id}`)
        } catch (error: any) {
            toast.error('Error al crear orden', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-8 pb-10"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/ordenes">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Nueva Orden
                    </h1>
                    <p className="text-muted-foreground mt-1">Registra un nuevo servicio de reparación</p>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Cliente & Equipo) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Cliente */}
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar cliente por nombre o cédula..."
                                    value={clienteSearch}
                                    onChange={(e) => {
                                        setClienteSearch(e.target.value)
                                        setShowClienteDropdown(true)
                                        if (formData.cliente_id) {
                                            setFormData(f => ({ ...f, cliente_id: '', clienteNombre: '' }))
                                        }
                                    }}
                                    onFocus={() => setShowClienteDropdown(true)}
                                    className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 py-6 text-lg"
                                />
                                {formData.cliente_id && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1 text-sm font-medium">
                                        <Check className="h-3 w-3" />
                                        Seleccionado
                                    </div>
                                )}

                                {/* Dropdown */}
                                {showClienteDropdown && clientes.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[300px] overflow-y-auto">
                                        {clientes.map(cliente => (
                                            <button
                                                key={cliente.id}
                                                className="w-full p-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between group"
                                                onClick={() => handleSelectCliente(cliente)}
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-blue-700">{cliente.nombre}</p>
                                                    <p className="text-sm text-gray-500">{cliente.identificacion}</p>
                                                </div>
                                                {cliente.telefono && <span className="text-xs text-gray-400">{cliente.telefono}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!formData.cliente_id && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Si el cliente no existe, busca para verificar y si no aparece, puedes dejarlo vacío (Consumidor Final) o crearlo desde Clientes.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Equipo */}
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Package className="h-5 w-5 text-purple-600" />
                                </div>
                                Datos del Equipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Equipo / Herramienta <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.equipo_tipo}
                                    onChange={(e) => setFormData(f => ({ ...f, equipo_tipo: e.target.value }))}
                                    className="bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                    placeholder="Ej: Taladro percutor, Amoladora 9 pulgadas"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Marca</Label>
                                    <Select
                                        value={formData.equipo_marca}
                                        onValueChange={(v) => setFormData(f => ({ ...f, equipo_marca: v }))}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {marcas.map(marca => (
                                                <SelectItem key={marca} value={marca}>
                                                    {marca}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Modelo</Label>
                                    <Input
                                        value={formData.equipo_modelo}
                                        onChange={(e) => setFormData(f => ({ ...f, equipo_modelo: e.target.value }))}
                                        className="bg-white border-gray-200"
                                        placeholder="Ej: GBH 2-26"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">N° Serie</Label>
                                    <Input
                                        value={formData.equipo_serie}
                                        onChange={(e) => setFormData(f => ({ ...f, equipo_serie: e.target.value }))}
                                        className="bg-white border-gray-200 font-mono"
                                        placeholder="Ej: ABC123456"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700">Accesorios que deja</Label>
                                <Input
                                    value={formData.accesorios}
                                    onChange={(e) => setFormData(f => ({ ...f, accesorios: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="Ej: Estuche original, 2 brocas, llave Allen"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Costos y Repuestos (NEW) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </div>
                                Costos Iniciales y Repuestos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mano de Obra */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">Mano de Obra Estimada ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manoObra}
                                        onChange={(e) => setManoObra(parseFloat(e.target.value) || 0)}
                                        className="bg-white border-gray-200 text-lg font-semibold text-emerald-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">Total Estimado ($)</Label>
                                    <div className="h-10 flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-lg font-bold text-gray-900">
                                        ${totalEstimado.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Agregar Repuestos / Materiales</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar repuesto..."
                                        value={productoSearch}
                                        onChange={(e) => {
                                            setProductoSearch(e.target.value)
                                            setShowProductoDropdown(true)
                                        }}
                                        onFocus={() => setShowProductoDropdown(true)}
                                        className="pl-10 bg-white border-gray-200"
                                    />
                                    {showProductoDropdown && productosList.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                                            {productosList.map(prod => (
                                                <button
                                                    key={prod.id}
                                                    type="button"
                                                    className="w-full p-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50 flex justify-between items-center"
                                                    onClick={() => addRepuesto(prod)}
                                                >
                                                    <span className="font-medium text-gray-800">{prod.nombre}</span>
                                                    <span className="text-sm font-bold text-emerald-600">${prod.precio_venta}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Repuestos Seleccionados */}
                            {repuestos.length > 0 && (
                                <div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    {repuestos.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white shadow-sm rounded-lg border border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{item.nombre}</span>
                                                <span className="text-xs text-gray-500">{item.cantidad} x ${item.precio.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900">${(item.cantidad * item.precio).toFixed(2)}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeRepuesto(item.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>


                {/* Right Column (Problema & Asignación) */}
                <div className="space-y-6">
                    {/* Problema */}
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-amber-600" />
                                </div>
                                Detalle del Problema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Problema Reportado</Label>
                                <Textarea
                                    value={formData.problema_reportado}
                                    onChange={(e) => setFormData(f => ({ ...f, problema_reportado: e.target.value }))}
                                    className="bg-white border-gray-200 min-h-[120px] focus:border-amber-500 focus:ring-amber-500/20"
                                    placeholder="Describe detalladamente el fallo reportado por el cliente..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Observaciones (Recepción)</Label>
                                <Textarea
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData(f => ({ ...f, observaciones: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="Estado físico, golpes previos, rayones..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Asignación */}
                    <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4 border-b border-gray-100/50">
                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Wrench className="h-5 w-5 text-emerald-600" />
                                </div>
                                Asignación Inicial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Técnico Asignado</Label>
                                <Select
                                    value={formData.tecnico_id}
                                    onValueChange={(v) => setFormData(f => ({ ...f, tecnico_id: v }))}
                                >
                                    <SelectTrigger className="bg-white border-gray-200">
                                        <SelectValue placeholder="Sin asignar (Pendiente)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tecnicos.map(tecnico => (
                                            <SelectItem key={tecnico.id} value={tecnico.id}>
                                                {tecnico.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Prioridad</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {prioridades.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setFormData(f => ({ ...f, prioridad: p.value }))}
                                            className={`
                                                px-3 py-2 rounded-lg text-sm font-medium border transition-all
                                                ${formData.prioridad === p.value
                                                    ? `${p.color} border-current ring-1 ring-current shadow-sm`
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4">
                        <Link href="/ordenes" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Crear Orden
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
