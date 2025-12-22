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
    { value: 'baja', label: 'Baja', color: 'border-slate-500' },
    { value: 'normal', label: 'Normal', color: 'border-blue-500' },
    { value: 'alta', label: 'Alta', color: 'border-amber-500' },
    { value: 'urgente', label: 'Urgente', color: 'border-red-500' },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/ordenes">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nueva Orden de Servicio</h1>
                    <p className="text-slate-400 mt-1">Registra un nuevo equipo para reparación</p>
                </div>
            </div>

            {/* Form */}
            <div className="grid gap-6">
                {/* Cliente */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-400" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
                                className="pl-10 bg-white/5 border-white/10 text-white"
                            />
                            {formData.cliente_id && (
                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                            )}

                            {/* Dropdown */}
                            {showClienteDropdown && clientes.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl">
                                    {clientes.map(cliente => (
                                        <button
                                            key={cliente.id}
                                            className="w-full p-3 text-left hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg"
                                            onClick={() => handleSelectCliente(cliente)}
                                        >
                                            <p className="font-medium text-white">{cliente.nombre}</p>
                                            <p className="text-sm text-slate-400">{cliente.identificacion} · {cliente.telefono}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">
                            <AlertCircle className="inline h-3 w-3 mr-1" />
                            Si el cliente no existe, déjalo vacío y créalo después
                        </p>
                    </CardContent>
                </Card>

                {/* Equipo */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-400" />
                            Datos del Equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Equipo / Herramienta *</Label>
                            <Input
                                value={formData.equipo_tipo}
                                onChange={(e) => setFormData(f => ({ ...f, equipo_tipo: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: Taladro percutor, Amoladora 9 pulgadas"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Marca</Label>
                                <Select
                                    value={formData.equipo_marca}
                                    onValueChange={(v) => setFormData(f => ({ ...f, equipo_marca: v }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        {marcas.map(marca => (
                                            <SelectItem key={marca} value={marca} className="text-white">
                                                {marca}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Modelo</Label>
                                <Input
                                    value={formData.equipo_modelo}
                                    onChange={(e) => setFormData(f => ({ ...f, equipo_modelo: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="GBH 2-26"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">N° Serie</Label>
                                <Input
                                    value={formData.equipo_serie}
                                    onChange={(e) => setFormData(f => ({ ...f, equipo_serie: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="ABC123456"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Accesorios que deja</Label>
                            <Input
                                value={formData.accesorios}
                                onChange={(e) => setFormData(f => ({ ...f, accesorios: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Ej: Estuche original, 2 brocas, llave Allen"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Problema */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-400" />
                            Problema Reportado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Descripción del problema</Label>
                            <Textarea
                                value={formData.problema_reportado}
                                onChange={(e) => setFormData(f => ({ ...f, problema_reportado: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                placeholder="Describe el problema que reporta el cliente..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Observaciones de recepción</Label>
                            <Textarea
                                value={formData.observaciones}
                                onChange={(e) => setFormData(f => ({ ...f, observaciones: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Estado físico, golpes, daños visibles..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Asignación */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-emerald-400" />
                            Asignación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Técnico asignado</Label>
                                <Select
                                    value={formData.tecnico_id}
                                    onValueChange={(v) => setFormData(f => ({ ...f, tecnico_id: v }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Sin asignar" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        {tecnicos.map(tecnico => (
                                            <SelectItem key={tecnico.id} value={tecnico.id} className="text-white">
                                                {tecnico.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Prioridad</Label>
                                <Select
                                    value={formData.prioridad}
                                    onValueChange={(v) => setFormData(f => ({ ...f, prioridad: v }))}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-white/10">
                                        {prioridades.map(p => (
                                            <SelectItem key={p.value} value={p.value} className="text-white">
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Link href="/ordenes">
                        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Crear Orden
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
