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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
    Search,
    Plus,
    Users,
    Edit,
    Shield,
    Mail,
    Loader2,
    RefreshCw,
    UserCheck,
    UserX,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Usuario {
    id: string
    nombre: string
    email: string
    rol: string
    role_id: string | null
    role: { id: string; nombre: string } | null
    activo: boolean
    created_at?: string
}

interface Role {
    id: string
    nombre: string
    descripcion: string | null
    es_sistema: boolean
    usuarios_count: number
}

export default function UsuariosPage() {
    const { user } = useAuthStore()
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'tecnico',
        role_id: '',
        activo: true,
    })

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            // Load users
            const usersResponse = await fetch(`/api/usuarios?empresa_id=${user.empresa_id}`)
            if (!usersResponse.ok) throw new Error('Error al cargar usuarios')
            const usersData = await usersResponse.json()
            setUsuarios(usersData || [])

            // Load roles
            const rolesResponse = await fetch(`/api/roles?empresa_id=${user.empresa_id}`)
            if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json()
                setRoles(rolesData || [])
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            toast.error('Error al cargar datos', { description: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredUsuarios = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const openEditDialog = (usuario: Usuario) => {
        setSelectedUsuario(usuario)
        setFormData({
            nombre: usuario.nombre,
            email: usuario.email,
            password: '',
            rol: usuario.rol,
            role_id: usuario.role_id || '',
            activo: usuario.activo,
        })
        setIsDialogOpen(true)
    }

    const openCreateDialog = () => {
        setSelectedUsuario(null)
        setFormData({
            nombre: '',
            email: '',
            password: '',
            rol: 'tecnico',
            role_id: '',
            activo: true,
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nombre || !formData.email) {
            toast.error('Nombre y email son requeridos')
            return
        }

        if (!selectedUsuario && !formData.password) {
            toast.error('La contraseña es requerida para nuevos usuarios')
            return
        }

        setIsSaving(true)
        try {
            let response
            if (selectedUsuario) {
                // Update existing user
                const updateData: Record<string, unknown> = {
                    nombre: formData.nombre,
                    rol: formData.rol,
                    role_id: formData.role_id || null,
                    activo: formData.activo,
                }

                response = await fetch(`/api/usuarios/${selectedUsuario.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                })
            } else {
                // Create new user
                response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        empresa_id: user?.empresa_id,
                        nombre: formData.nombre,
                        email: formData.email,
                        password: formData.password,
                        rol: formData.rol,
                    })
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al guardar')
            }

            toast.success(selectedUsuario ? 'Usuario actualizado' : 'Usuario creado')
            setIsDialogOpen(false)
            loadData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
            toast.error('Error', { description: errorMessage })
        } finally {
            setIsSaving(false)
        }
    }

    const toggleUserStatus = async (usuario: Usuario) => {
        try {
            const response = await fetch(`/api/usuarios/${usuario.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: !usuario.activo })
            })

            if (!response.ok) throw new Error('Error al actualizar')

            toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado')
            loadData()
        } catch {
            toast.error('Error al cambiar estado del usuario')
        }
    }

    const getRoleBadgeColor = (rol: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700 border-purple-200',
            tecnico: 'bg-blue-100 text-blue-700 border-blue-200',
            vendedor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        }
        return colors[rol] || 'bg-gray-100 text-gray-700 border-gray-200'
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
                        Usuarios
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestiona los usuarios y sus roles de acceso</p>
                </div>
                <PermissionGate permission="users.create">
                    <Button
                        onClick={openCreateDialog}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Usuario
                    </Button>
                </PermissionGate>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Total Usuarios</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{usuarios.length}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Activos</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">
                                    {usuarios.filter(u => u.activo).length}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <UserCheck className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Inactivos</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">
                                    {usuarios.filter(u => !u.activo).length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-xl">
                                <UserX className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Roles</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">{roles.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200 focus:ring-purple-500/20"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadData}
                            className="bg-white border-gray-200 hover:bg-gray-50"
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
                    ) : filteredUsuarios.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No se encontraron usuarios</h3>
                            <p className="text-muted-foreground mt-1 mb-6">No hay usuarios que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="border-gray-100 hover:bg-transparent">
                                    <TableHead className="text-gray-600 font-semibold">Usuario</TableHead>
                                    <TableHead className="text-gray-600 font-semibold">Rol</TableHead>
                                    <TableHead className="text-gray-600 font-semibold">Estado</TableHead>
                                    <TableHead className="text-gray-600 font-semibold text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsuarios.map((usuario) => (
                                    <TableRow key={usuario.id} className="border-gray-100 hover:bg-purple-50/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                                    {usuario.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-semibold">{usuario.nombre}</p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {usuario.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Badge className={`${getRoleBadgeColor(usuario.rol)} border`}>
                                                    {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                                                </Badge>
                                                {usuario.role && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        {usuario.role.nombre}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={usuario.activo
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-100 text-red-700 border border-red-200'
                                            }>
                                                {usuario.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <PermissionGate permission="users.update">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(usuario)}
                                                        className="hover:bg-purple-50 hover:text-purple-600 text-gray-500"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleUserStatus(usuario)}
                                                        className={usuario.activo
                                                            ? 'hover:bg-red-50 hover:text-red-600 text-gray-500'
                                                            : 'hover:bg-emerald-50 hover:text-emerald-600 text-gray-500'
                                                        }
                                                    >
                                                        {usuario.activo ? (
                                                            <><UserX className="h-4 w-4 mr-1" />Desactivar</>
                                                        ) : (
                                                            <><UserCheck className="h-4 w-4 mr-1" />Activar</>
                                                        )}
                                                    </Button>
                                                </PermissionGate>
                                            </div>
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
                <DialogContent className="bg-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            {selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Nombre <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Email <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                className="bg-white border-gray-200"
                                placeholder="correo@ejemplo.com"
                                disabled={!!selectedUsuario}
                            />
                        </div>

                        {!selectedUsuario && (
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Contraseña <span className="text-red-500">*</span></Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Rol Base</Label>
                                <Select
                                    value={formData.rol}
                                    onValueChange={(value) => setFormData(f => ({ ...f, rol: value }))}
                                >
                                    <SelectTrigger className="bg-white border-gray-200">
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="tecnico">Técnico</SelectItem>
                                        <SelectItem value="vendedor">Vendedor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {roles.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium">Rol Personalizado</Label>
                                    <Select
                                        value={formData.role_id || 'none'}
                                        onValueChange={(value) => setFormData(f => ({ ...f, role_id: value === 'none' ? '' : value }))}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200">
                                            <SelectValue placeholder="Opcional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin rol personalizado</SelectItem>
                                            {roles.map(role => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {selectedUsuario && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <Label className="text-gray-700 font-medium">Estado</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.activo ? 'El usuario puede acceder al sistema' : 'El usuario no puede acceder'}
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.activo}
                                    onCheckedChange={(checked) => setFormData(f => ({ ...f, activo: checked }))}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-200 bg-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md gap-2">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
