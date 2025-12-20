// src/app/(dashboard)/configuracion/page.tsx
// Business settings and configuration

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { PermissionGate } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Building2,
    User,
    Bell,
    Shield,
    Palette,
    Receipt,
    Save,
    Loader2,
} from 'lucide-react'

interface EmpresaData {
    id: string
    nombre: string
    ruc: string | null
    direccion: string | null
    telefono: string | null
    email: string | null
    logo_url: string | null
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function ConfiguracionPage() {
    const { user } = useAuthStore()
    const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('empresa')
    const supabase = createClient()

    // Form states
    const [formData, setFormData] = useState({
        nombre: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
    })

    const [notificaciones, setNotificaciones] = useState({
        email_ordenes: true,
        email_pagos: true,
        whatsapp_ordenes: false,
    })

    useEffect(() => {
        loadEmpresa()
    }, [user?.empresa_id])

    const loadEmpresa = async () => {
        if (!user?.empresa_id) return

        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', user.empresa_id)
                .single()

            if (error) throw error
            setEmpresa(data)
            setFormData({
                nombre: data.nombre || '',
                ruc: data.ruc || '',
                direccion: data.direccion || '',
                telefono: data.telefono || '',
                email: data.email || '',
            })
        } catch (error) {
            console.error('Error loading empresa:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!user?.empresa_id) return

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('empresas')
                .update({
                    nombre: formData.nombre,
                    ruc: formData.ruc,
                    direccion: formData.direccion,
                    telefono: formData.telefono,
                    email: formData.email,
                })
                .eq('id', user.empresa_id)

            if (error) throw error
            toast.success('Configuración guardada')
        } catch (error: any) {
            console.error('Error saving:', error)
            toast.error('Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-xl font-semibold text-[hsl(var(--text-primary))]">
                    Configuración
                </h1>
                <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Administra la configuración de tu negocio
                </p>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-[hsl(var(--surface-highlight))] border border-[hsl(var(--border-subtle))]">
                        <TabsTrigger value="empresa" className="gap-2 data-[state=active]:bg-[hsl(var(--surface-elevated))]">
                            <Building2 className="h-4 w-4" />
                            Empresa
                        </TabsTrigger>
                        <TabsTrigger value="notificaciones" className="gap-2 data-[state=active]:bg-[hsl(var(--surface-elevated))]">
                            <Bell className="h-4 w-4" />
                            Notificaciones
                        </TabsTrigger>
                        <TabsTrigger value="facturacion" className="gap-2 data-[state=active]:bg-[hsl(var(--surface-elevated))]">
                            <Receipt className="h-4 w-4" />
                            Facturación
                        </TabsTrigger>
                    </TabsList>

                    {/* Empresa Tab */}
                    <TabsContent value="empresa" className="mt-6">
                        <Card className="card-linear">
                            <CardHeader>
                                <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                    Datos de la Empresa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre de la Empresa</Label>
                                        <Input
                                            value={formData.nombre}
                                            onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                                            className="input-linear"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>RUC</Label>
                                        <Input
                                            value={formData.ruc}
                                            onChange={(e) => setFormData(f => ({ ...f, ruc: e.target.value }))}
                                            className="input-linear"
                                            maxLength={13}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Dirección</Label>
                                        <Textarea
                                            value={formData.direccion}
                                            onChange={(e) => setFormData(f => ({ ...f, direccion: e.target.value }))}
                                            className="input-linear resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Teléfono</Label>
                                        <Input
                                            value={formData.telefono}
                                            onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                                            className="input-linear"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                            className="input-linear"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="gap-2 bg-[hsl(var(--brand-accent))]"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notificaciones Tab */}
                    <TabsContent value="notificaciones" className="mt-6">
                        <Card className="card-linear">
                            <CardHeader>
                                <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                    Preferencias de Notificaciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                                        <div>
                                            <p className="font-medium text-[hsl(var(--text-primary))]">Notificaciones de órdenes por email</p>
                                            <p className="text-sm text-[hsl(var(--text-muted))]">Recibir emails cuando hay cambios en órdenes</p>
                                        </div>
                                        <Switch
                                            checked={notificaciones.email_ordenes}
                                            onCheckedChange={(v) => setNotificaciones(n => ({ ...n, email_ordenes: v }))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                                        <div>
                                            <p className="font-medium text-[hsl(var(--text-primary))]">Notificaciones de pagos por email</p>
                                            <p className="text-sm text-[hsl(var(--text-muted))]">Recibir emails sobre pagos recibidos</p>
                                        </div>
                                        <Switch
                                            checked={notificaciones.email_pagos}
                                            onCheckedChange={(v) => setNotificaciones(n => ({ ...n, email_pagos: v }))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                                        <div>
                                            <p className="font-medium text-[hsl(var(--text-primary))]">Notificaciones por WhatsApp</p>
                                            <p className="text-sm text-[hsl(var(--text-muted))]">Enviar actualizaciones a clientes por WhatsApp</p>
                                        </div>
                                        <Switch
                                            checked={notificaciones.whatsapp_ordenes}
                                            onCheckedChange={(v) => setNotificaciones(n => ({ ...n, whatsapp_ordenes: v }))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Facturación Tab */}
                    <TabsContent value="facturacion" className="mt-6">
                        <Card className="card-linear">
                            <CardHeader>
                                <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                    Configuración de Facturación SRI
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Receipt className="h-12 w-12 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-50" />
                                    <p className="text-[hsl(var(--text-secondary))]">
                                        Configura la facturación electrónica desde la página de Facturación
                                    </p>
                                    <Button variant="outline" className="mt-4 border-[hsl(var(--border-subtle))]">
                                        Ir a Facturación
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    )
}
