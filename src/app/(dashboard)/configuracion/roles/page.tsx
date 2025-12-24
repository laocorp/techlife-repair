'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Loader2,
    RefreshCw,
    Lock,
    Users,
    ChevronRight,
} from 'lucide-react'

interface Permission {
    id: string
    codigo: string
    nombre: string
    modulo: string
    descripcion: string | null
}

interface Role {
    id: string
    nombre: string
    descripcion: string | null
    es_sistema: boolean
    empresa_id: string | null
    usuarios_count: number
    permisos: Permission[]
}

// Module display names
const moduleNames: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Punto de Venta',
    inventory: 'Inventario',
    orders: 'Órdenes',
    cash: 'Caja',
    clients: 'Clientes',
    reports: 'Reportes',
    invoices: 'Facturación',
    settings: 'Configuración',
    users: 'Usuarios',
    roles: 'Roles',
    logs: 'Actividad',
    client_portal: 'Portal Cliente',
}

export default function RolesPage() {
    const { user } = useAuthStore()
    const [roles, setRoles] = useState<Role[]>([])
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        permisos: [] as string[],
    })

    const loadData = useCallback(async () => {
        if (!user?.empresa_id) return

        setIsLoading(true)
        try {
            // Load roles
            const rolesResponse = await fetch(`/api/roles?empresa_id=${user.empresa_id}`)
            if (!rolesResponse.ok) throw new Error('Error al cargar roles')
            const rolesData = await rolesResponse.json()
            setRoles(rolesData || [])

            // Load permissions
            const permissionsResponse = await fetch('/api/permisos')
            if (permissionsResponse.ok) {
                const permissionsData = await permissionsResponse.json()
                setAllPermissions(permissionsData.permissions || [])
                setGroupedPermissions(permissionsData.grouped || {})
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

    const openCreateDialog = () => {
        setSelectedRole(null)
        setFormData({
            nombre: '',
            descripcion: '',
            permisos: [],
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (role: Role) => {
        setSelectedRole(role)
        setFormData({
            nombre: role.nombre,
            descripcion: role.descripcion || '',
            permisos: role.permisos.map(p => p.id),
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.nombre) {
            toast.error('El nombre es requerido')
            return
        }

        setIsSaving(true)
        try {
            let response
            if (selectedRole) {
                // Update existing role
                response = await fetch(`/api/roles/${selectedRole.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion || null,
                        permisos: formData.permisos,
                    })
                })
            } else {
                // Create new role
                response = await fetch('/api/roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        empresa_id: user?.empresa_id,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion || null,
                        permisos: formData.permisos,
                    })
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al guardar')
            }

            toast.success(selectedRole ? 'Rol actualizado' : 'Rol creado')
            setIsDialogOpen(false)
            loadData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
            toast.error('Error', { description: errorMessage })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedRole || selectedRole.es_sistema) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al eliminar')
            }

            toast.success('Rol eliminado')
            setIsDialogOpen(false)
            loadData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar'
            toast.error('Error', { description: errorMessage })
        } finally {
            setIsDeleting(false)
        }
    }

    const togglePermission = (permissionId: string) => {
        setFormData(f => ({
            ...f,
            permisos: f.permisos.includes(permissionId)
                ? f.permisos.filter(id => id !== permissionId)
                : [...f.permisos, permissionId]
        }))
    }

    const toggleModulePermissions = (modulo: string) => {
        const modulePerms = groupedPermissions[modulo] || []
        const modulePermIds = modulePerms.map(p => p.id)
        const allSelected = modulePermIds.every(id => formData.permisos.includes(id))

        if (allSelected) {
            // Remove all module permissions
            setFormData(f => ({
                ...f,
                permisos: f.permisos.filter(id => !modulePermIds.includes(id))
            }))
        } else {
            // Add all module permissions
            setFormData(f => ({
                ...f,
                permisos: [...new Set([...f.permisos, ...modulePermIds])]
            }))
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
                        Roles y Permisos
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestiona los roles y sus permisos de acceso</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadData}
                        className="bg-white border-gray-200 hover:bg-gray-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <PermissionGate permission="roles.manage">
                        <Button
                            onClick={openCreateDialog}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Rol
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            {/* Roles Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full bg-gray-100" />
                    ))}
                </div>
            ) : roles.length === 0 ? (
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg">
                    <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Shield className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No hay roles</h3>
                        <p className="text-muted-foreground mt-1 mb-6">Crea tu primer rol personalizado para comenzar.</p>
                        <Button onClick={openCreateDialog} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Crear Rol
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <Card
                            key={role.id}
                            className="bg-white/60 backdrop-blur-xl border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => openEditDialog(role)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.es_sistema ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                            {role.es_sistema ? (
                                                <Lock className="h-5 w-5 text-purple-600" />
                                            ) : (
                                                <Shield className="h-5 w-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{role.nombre}</CardTitle>
                                            {role.es_sistema && (
                                                <Badge variant="outline" className="text-xs mt-1 border-purple-200 text-purple-600">
                                                    Sistema
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {role.descripcion || 'Sin descripción'}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>{role.permisos.length} permisos</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{role.usuarios_count} usuarios</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {selectedRole ? 'Editar Rol' : 'Nuevo Rol'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">
                                    Nombre <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                    className="bg-white border-gray-200"
                                    placeholder="Ej: Supervisor"
                                    disabled={selectedRole?.es_sistema}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Descripción</Label>
                                <Textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                                    className="bg-white border-gray-200 resize-none h-10"
                                    placeholder="Descripción del rol..."
                                />
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="space-y-4">
                            <Label className="text-gray-700 font-medium text-lg">Permisos</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(groupedPermissions).map(([modulo, perms]) => {
                                    const modulePermIds = perms.map(p => p.id)
                                    const selectedCount = modulePermIds.filter(id => formData.permisos.includes(id)).length
                                    const allSelected = selectedCount === modulePermIds.length

                                    return (
                                        <Card key={modulo} className="border-gray-200">
                                            <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={allSelected}
                                                            onCheckedChange={() => toggleModulePermissions(modulo)}
                                                        />
                                                        <span className="font-medium text-gray-900">
                                                            {moduleNames[modulo] || modulo}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {selectedCount}/{perms.length}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-3 space-y-2">
                                                {perms.map((perm) => (
                                                    <div key={perm.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={perm.id}
                                                            checked={formData.permisos.includes(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                        />
                                                        <label
                                                            htmlFor={perm.id}
                                                            className="text-sm text-gray-700 cursor-pointer"
                                                        >
                                                            {perm.nombre}
                                                        </label>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div>
                            {selectedRole && !selectedRole.es_sistema && (
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting || selectedRole.usuarios_count > 0}
                                    className="gap-2"
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    Eliminar
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-200 bg-white">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md gap-2"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Guardar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
