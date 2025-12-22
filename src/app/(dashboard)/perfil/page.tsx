// src/app/(dashboard)/perfil/page.tsx
// User profile page

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
    User,
    Mail,
    Phone,
    Shield,
    Save,
    Loader2,
    Key,
    Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const rolLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
    tecnico: { label: 'Técnico', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    vendedor: { label: 'Vendedor', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

export default function PerfilPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        nombre: user?.nombre || '',
        email: user?.email || '',
        telefono: '',
    })

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: '',
    })

    const handleSaveProfile = async () => {
        if (!user?.id) return

        setIsSaving(true)
        try {
            const response = await fetch(`/api/usuarios/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: formData.nombre })
            })

            if (!response.ok) throw new Error('Error al guardar')

            toast.success('Perfil actualizado')
        } catch (error: any) {
            console.error('Error saving profile:', error)
            toast.error('Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.new !== passwordData.confirm) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (passwordData.new.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`/api/usuarios/${user?.id}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al cambiar contraseña')
            }

            toast.success('Contraseña actualizada')
            setPasswordData({ current: '', new: '', confirm: '' })
        } catch (error: any) {
            console.error('Error changing password:', error)
            toast.error(error.message || 'Error al cambiar contraseña')
        } finally {
            setIsLoading(false)
        }
    }

    const rol = rolLabels[user?.rol || 'vendedor'] || rolLabels.vendedor

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl"
        >
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Mi Perfil
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Gestiona tu información personal
                </p>
            </div>

            {/* Profile Card */}
            <Card className="card-linear">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white text-2xl font-bold">
                                {user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                                {user?.nombre}
                            </h2>
                            <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
                                {user?.email}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <Badge className={rol.color}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {rol.label}
                                </Badge>
                                {user?.created_at && (
                                    <span className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Miembro desde {format(new Date(user.created_at), 'MMM yyyy', { locale: es })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Profile */}
            <Card className="card-linear">
                <CardHeader>
                    <CardTitle className="text-lg text-[hsl(var(--text-primary))] flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información Personal
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre Completo</Label>
                            <Input
                                value={formData.nombre}
                                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                className="input-linear"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={formData.email}
                                disabled
                                className="input-linear opacity-50"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="gap-2 bg-[hsl(var(--brand-accent))]"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="card-linear">
                <CardHeader>
                    <CardTitle className="text-lg text-[hsl(var(--text-primary))] flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Cambiar Contraseña
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña</Label>
                            <Input
                                type="password"
                                value={passwordData.new}
                                onChange={(e) => setPasswordData(p => ({ ...p, new: e.target.value }))}
                                className="input-linear"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Contraseña</Label>
                            <Input
                                type="password"
                                value={passwordData.confirm}
                                onChange={(e) => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                                className="input-linear"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleChangePassword}
                            disabled={isLoading || !passwordData.new}
                            variant="outline"
                            className="gap-2 border-[hsl(var(--border-subtle))]"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                            Cambiar Contraseña
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
