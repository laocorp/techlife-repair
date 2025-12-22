'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    FileText,
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p className="text-slate-400 mt-1">Gestiona la base de clientes</p>
                </div>
                <PermissionGate permission="clients.create">
                    <Button
                        onClick={openCreateDialog}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Clientes</p>
                                <p className="text-2xl font-bold text-white">{clientes.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar por nombre, cédula o teléfono..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadClientes}
                            className="border-white/10 text-slate-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full bg-white/10" />
                            ))}
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400">No se encontraron clientes</p>
                            <PermissionGate permission="clients.create">
                                <Button variant="link" className="text-blue-400 mt-2" onClick={openCreateDialog}>
                                    Crear primer cliente
                                </Button>
                            </PermissionGate>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Cliente</TableHead>
                                    <TableHead className="text-slate-400">Identificación</TableHead>
                                    <TableHead className="text-slate-400">Contacto</TableHead>
                                    <TableHead className="text-slate-400">Registrado</TableHead>
                                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClientes.map((cliente) => (
                                    <TableRow key={cliente.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell>
                                            <p className="text-white font-medium">{cliente.nombre}</p>
                                            {cliente.direccion && (
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {cliente.direccion}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-white/10 text-slate-300">
                                                {(cliente.tipo_id || 'cedula').toUpperCase()}
                                            </Badge>
                                            <p className="text-white mt-1">{cliente.identificacion || '-'}</p>
                                        </TableCell>
                                        <TableCell>
                                            {cliente.telefono && (
                                                <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1 text-blue-400 hover:underline text-sm">
                                                    <Phone className="h-3 w-3" />
                                                    {cliente.telefono}
                                                </a>
                                            )}
                                            {cliente.email && (
                                                <a href={`mailto:${cliente.email}`} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
                                                    <Mail className="h-3 w-3" />
                                                    {cliente.email}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-slate-400 text-sm">
                                                {format(new Date(cliente.created_at), 'dd MMM yyyy', { locale: es })}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <PermissionGate permission="clients.update">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(cliente)}
                                                    className="gap-2 text-slate-400 hover:text-white"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </Button>
                                            </PermissionGate>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Nombre *</Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Tipo</Label>
                                <select
                                    value={formData.tipo_id}
                                    onChange={(e) => setFormData(f => ({ ...f, tipo_id: e.target.value }))}
                                    className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3"
                                >
                                    <option value="cedula">Cédula</option>
                                    <option value="ruc">RUC</option>
                                    <option value="pasaporte">Pasaporte</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Identificación</Label>
                                <Input
                                    value={formData.identificacion}
                                    onChange={(e) => setFormData(f => ({ ...f, identificacion: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Teléfono</Label>
                                <Input
                                    value={formData.telefono}
                                    onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="0991234567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Dirección</Label>
                            <Input
                                value={formData.direccion}
                                onChange={(e) => setFormData(f => ({ ...f, direccion: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Calle, ciudad..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-blue-500 to-purple-600 gap-2">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
