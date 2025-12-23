'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
    Search,
    Plus,
    Users,
    Edit,
    Phone,
    Mail,
    MapPin,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Cliente {
    id: string
    nombre: string
    identificacion: string
    tipo_id: string
    email: string | null
    telefono: string | null
    direccion: string | null
    created_at: string
}

export default function ClientesPage() {
    const { user } = useAuthStore()
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        identificacion: '',
        tipo_id: 'cedula',
        email: '',
        telefono: '',
        direccion: '',
    })

    const loadClientes = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/clientes?empresa_id=${user.empresa_id}`)

            if (!response.ok) throw new Error('Error al cargar clientes')

            const data = await response.json()
            setClientes(data || [])
        } catch (error: any) {
            toast.error('Error al cargar clientes', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadClientes()
    }, [loadClientes])

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.identificacion && c.identificacion.includes(searchQuery)) ||
        (c.telefono && c.telefono.includes(searchQuery))
    )

    const openCreateDialog = () => {
        setSelectedCliente(null)
        setFormData({
            nombre: '',
            identificacion: '',
            tipo_id: 'cedula',
            email: '',
            telefono: '',
            direccion: '',
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (cliente: Cliente) => {
        setSelectedCliente(cliente)
        setFormData({
            nombre: cliente.nombre,
            identificacion: cliente.identificacion || '',
            tipo_id: cliente.tipo_id || 'cedula',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || '',
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nombre) {
            toast.error('Nombre es requerido')
            return
        }

        setIsSaving(true)
        try {
            const clienteData = {
                empresa_id: user?.empresa_id,
                nombre: formData.nombre,
                identificacion: formData.identificacion || null,
                tipo_id: formData.tipo_id,
                email: formData.email || null,
                telefono: formData.telefono || null,
                direccion: formData.direccion || null,
            }

            let response
            if (selectedCliente) {
                response = await fetch(`/api/clientes/${selectedCliente.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                })
            } else {
                response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clienteData)
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al guardar')
            }

            toast.success(selectedCliente ? 'Cliente actualizado' : 'Cliente creado')
            setIsDialogOpen(false)
            loadClientes()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Clientes
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestiona tu base de clientes para ventas y servicios</p>
                </div>
                <PermissionGate permission="clients.create">
                    <Button
                        onClick={openCreateDialog}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Total Clientes</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{clientes.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg top-section-card">
                <CardContent className="p-6">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, cédula o teléfono..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200 focus:bg-white focus:ring-blue-500/20 transition-all font-medium"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadClientes}
                            className="bg-white border-gray-200 hover:bg-gray-50 hover:text-blue-600"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-gray-100" />
                            ))}
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No se encontraron clientes</h3>
                            <p className="text-muted-foreground mt-1 mb-6 max-w-sm">No hay clientes que coincidan con tu búsqueda.</p>
                            <PermissionGate permission="clients.create">
                                <Button variant="outline" className="gap-2" onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4" />
                                    Crear primer cliente
                                </Button>
                            </PermissionGate>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-gray-100 hover:bg-transparent">
                                        <TableHead className="text-gray-600 font-semibold">Cliente</TableHead>
                                        <TableHead className="text-gray-600 font-semibold">Identificación</TableHead>
                                        <TableHead className="text-gray-600 font-semibold">Contacto</TableHead>
                                        <TableHead className="text-gray-600 font-semibold">Registrado</TableHead>
                                        <TableHead className="text-gray-600 font-semibold text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClientes.map((cliente) => (
                                        <TableRow key={cliente.id} className="border-gray-100 hover:bg-blue-50/30 transition-colors group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs">
                                                        {cliente.nombre.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 font-semibold">{cliente.nombre}</p>
                                                        {cliente.direccion && (
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {cliente.direccion}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
                                                    {(cliente.tipo_id || 'cedula').toUpperCase()}
                                                </Badge>
                                                <p className="text-gray-700 font-mono text-sm mt-1">{cliente.identificacion || '-'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {cliente.telefono && (
                                                        <a href={`tel:${cliente.telefono}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm group/link">
                                                            <div className="p-1 rounded-md bg-gray-100 group-hover/link:bg-blue-100 group-hover/link:text-blue-600 transition-colors">
                                                                <Phone className="h-3 w-3" />
                                                            </div>
                                                            {cliente.telefono}
                                                        </a>
                                                    )}
                                                    {cliente.email && (
                                                        <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm group/link">
                                                            <div className="p-1 rounded-md bg-gray-100 group-hover/link:bg-blue-100 group-hover/link:text-blue-600 transition-colors">
                                                                <Mail className="h-3 w-3" />
                                                            </div>
                                                            {cliente.email}
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-muted-foreground text-sm">
                                                    {format(new Date(cliente.created_at), 'dd MMM yyyy', { locale: es })}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PermissionGate permission="clients.update">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(cliente)}
                                                        className="hover:bg-blue-50 hover:text-blue-600 text-gray-500"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Button>
                                                </PermissionGate>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Nombre Completo <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Tipo Documento</Label>
                                <select
                                    value={formData.tipo_id}
                                    onChange={(e) => setFormData(f => ({ ...f, tipo_id: e.target.value }))}
                                    className="w-full h-10 rounded-md bg-white border border-gray-200 text-gray-900 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="cedula">Cédula</option>
                                    <option value="ruc">RUC</option>
                                    <option value="pasaporte">Pasaporte</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Identificación</Label>
                                <Input
                                    value={formData.identificacion}
                                    onChange={(e) => setFormData(f => ({ ...f, identificacion: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">Teléfono</Label>
                                <Input
                                    value={formData.telefono}
                                    onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="0991234567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700">Dirección</Label>
                            <Input
                                value={formData.direccion}
                                onChange={(e) => setFormData(f => ({ ...f, direccion: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Calle, ciudad..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-200 bg-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 gap-2">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
