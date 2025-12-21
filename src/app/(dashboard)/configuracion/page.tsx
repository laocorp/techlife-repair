// src/app/(dashboard)/configuracion/page.tsx
// Business settings and configuration

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Building2,
    Bell,
    Receipt,
    Save,
    Loader2,
    FileKey,
    Landmark,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Info,
    Upload,
    Eye,
    EyeOff,
    ShieldCheck,
    Trash2,
} from 'lucide-react'
import { validateP12Certificate, type P12Info } from '@/lib/sri/xml-signer'

interface EmpresaData {
    id: string
    nombre: string
    ruc: string | null
    direccion: string | null
    telefono: string | null
    email: string | null
    logo_url: string | null
    ambiente_sri: 'pruebas' | 'produccion'
    establecimiento: string
    punto_emision: string
}

interface SriConfigData {
    establecimiento: string
    punto_emision: string
    ambiente: 'pruebas' | 'produccion'
    obligado_contabilidad: boolean
    contribuyente_especial: string
    firma_electronica_configurada: boolean
    firma_electronica_vence: string | null
    tipo_emision: string
}

interface FacturacionFormData {
    razon_social: string
    nombre_comercial: string
    direccion_matriz: string
    establecimiento: string
    punto_emision: string
    direccion_establecimiento: string
    ambiente: 'pruebas' | 'produccion'
    obligado_contabilidad: boolean
    contribuyente_especial: string
    tipo_emision: string
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
    const [isSavingFacturacion, setIsSavingFacturacion] = useState(false)
    const [activeTab, setActiveTab] = useState('empresa')
    const [sriConfigExists, setSriConfigExists] = useState(false)
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

    // Facturación form state
    const [facturacionData, setFacturacionData] = useState<FacturacionFormData>({
        razon_social: '',
        nombre_comercial: '',
        direccion_matriz: '',
        establecimiento: '001',
        punto_emision: '001',
        direccion_establecimiento: '',
        ambiente: 'pruebas',
        obligado_contabilidad: false,
        contribuyente_especial: '',
        tipo_emision: '1',
    })

    const [firmaStatus, setFirmaStatus] = useState<{
        configurada: boolean
        vence: string | null
        commonName?: string
    }>({
        configurada: false,
        vence: null,
    })

    // Certificate upload state
    const [p12File, setP12File] = useState<File | null>(null)
    const [p12Password, setP12Password] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isUploadingCert, setIsUploadingCert] = useState(false)
    const [certValidation, setCertValidation] = useState<{
        validated: boolean
        info?: P12Info
        error?: string
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadEmpresa()
    }, [user?.empresa_id])

    useEffect(() => {
        if (empresa?.id) {
            loadSriConfig()
        }
    }, [empresa?.id])

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

            // Set initial facturación data from empresa
            setFacturacionData(f => ({
                ...f,
                razon_social: data.nombre || '',
                direccion_matriz: data.direccion || '',
                establecimiento: data.establecimiento || '001',
                punto_emision: data.punto_emision || '001',
                ambiente: data.ambiente_sri || 'pruebas',
            }))
        } catch (error) {
            console.error('Error loading empresa:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadSriConfig = async () => {
        if (!empresa?.id) return

        try {
            const { data, error } = await supabase
                .from('sri_configuracion')
                .select('*')
                .eq('empresa_id', empresa.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No config exists yet
                    setSriConfigExists(false)
                    return
                }
                throw error
            }

            if (data) {
                setSriConfigExists(true)
                setFacturacionData(f => ({
                    ...f,
                    establecimiento: data.establecimiento || '001',
                    punto_emision: data.punto_emision || '001',
                    ambiente: data.ambiente || 'pruebas',
                    obligado_contabilidad: data.obligado_contabilidad || false,
                    contribuyente_especial: data.contribuyente_especial || '',
                    tipo_emision: data.tipo_emision || '1',
                }))
                setFirmaStatus({
                    configurada: data.firma_electronica_configurada || false,
                    vence: data.firma_electronica_vence || null,
                })
            }
        } catch (error) {
            console.error('Error loading SRI config:', error)
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
                toast.error('Por favor seleccione un archivo .p12 o .pfx')
                return
            }
            setP12File(file)
            setCertValidation(null)
            setP12Password('')
        }
    }

    const handleValidateCertificate = async () => {
        if (!p12File || !p12Password) {
            toast.error('Seleccione un archivo y escriba la contraseña')
            return
        }

        try {
            const buffer = await p12File.arrayBuffer()
            const result = await validateP12Certificate(buffer, p12Password)

            if (result.valid && result.info) {
                setCertValidation({
                    validated: true,
                    info: result.info,
                })
                toast.success(`Certificado válido: ${result.info.commonName}`)
            } else {
                setCertValidation({
                    validated: false,
                    error: result.error,
                })
                toast.error(result.error || 'Certificado inválido')
            }
        } catch (error: any) {
            setCertValidation({
                validated: false,
                error: error.message,
            })
            toast.error(error.message)
        }
    }

    const handleUploadCertificate = async () => {
        if (!certValidation?.validated || !certValidation.info || !p12File || !empresa?.id) {
            toast.error('Primero valide el certificado')
            return
        }

        setIsUploadingCert(true)
        try {
            // Upload to Supabase Storage
            const fileName = `${empresa.id}/certificate.p12`
            const { error: uploadError } = await supabase.storage
                .from('certificados')
                .upload(fileName, p12File, {
                    upsert: true,
                    contentType: 'application/x-pkcs12',
                })

            if (uploadError) {
                // If bucket doesn't exist, show helpful message
                if (uploadError.message.includes('not found')) {
                    throw new Error('El bucket "certificados" no existe. Créelo en Supabase Storage.')
                }
                throw uploadError
            }

            // Update sri_configuracion
            const updateData = {
                firma_electronica_configurada: true,
                firma_electronica_vence: certValidation.info.validTo.toISOString(),
                updated_at: new Date().toISOString(),
            }

            if (sriConfigExists) {
                const { error } = await supabase
                    .from('sri_configuracion')
                    .update(updateData)
                    .eq('empresa_id', empresa.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('sri_configuracion')
                    .insert({
                        empresa_id: empresa.id,
                        ...updateData,
                        establecimiento: '001',
                        punto_emision: '001',
                        ambiente: 'pruebas',
                        obligado_contabilidad: false,
                        tipo_emision: '1',
                        secuencial_factura: 1,
                        secuencial_nota_credito: 1,
                        secuencial_nota_debito: 1,
                        secuencial_retencion: 1,
                        secuencial_guia_remision: 1,
                    })

                if (error) throw error
                setSriConfigExists(true)
            }

            // Update local state
            setFirmaStatus({
                configurada: true,
                vence: certValidation.info.validTo.toISOString(),
                commonName: certValidation.info.commonName,
            })

            // Reset upload form
            setP12File(null)
            setP12Password('')
            setCertValidation(null)
            if (fileInputRef.current) fileInputRef.current.value = ''

            toast.success('Certificado guardado correctamente')
        } catch (error: any) {
            console.error('Error uploading certificate:', error)
            toast.error(error.message || 'Error al guardar el certificado')
        } finally {
            setIsUploadingCert(false)
        }
    }

    const handleRemoveCertificate = async () => {
        if (!empresa?.id) return

        try {
            // Remove from storage
            await supabase.storage
                .from('certificados')
                .remove([`${empresa.id}/certificate.p12`])

            // Update config
            await supabase
                .from('sri_configuracion')
                .update({
                    firma_electronica_configurada: false,
                    firma_electronica_vence: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('empresa_id', empresa.id)

            setFirmaStatus({
                configurada: false,
                vence: null,
            })

            toast.success('Certificado eliminado')
        } catch (error: any) {
            toast.error('Error al eliminar certificado')
        }
    }

    const validateSriCode = (code: string): boolean => {
        return /^\d{3}$/.test(code)
    }

    const handleSaveFacturacion = async () => {
        if (!user?.empresa_id || !empresa?.id) return

        // Validate codes
        if (!validateSriCode(facturacionData.establecimiento)) {
            toast.error('El código de establecimiento debe ser de 3 dígitos (ej: 001)')
            return
        }
        if (!validateSriCode(facturacionData.punto_emision)) {
            toast.error('El punto de emisión debe ser de 3 dígitos (ej: 001)')
            return
        }

        setIsSavingFacturacion(true)
        try {
            // Update empresa table
            const { error: empresaError } = await supabase
                .from('empresas')
                .update({
                    nombre: facturacionData.razon_social,
                    direccion: facturacionData.direccion_matriz,
                    establecimiento: facturacionData.establecimiento,
                    punto_emision: facturacionData.punto_emision,
                    ambiente_sri: facturacionData.ambiente,
                })
                .eq('id', empresa.id)

            if (empresaError) throw empresaError

            // Upsert sri_configuracion
            const sriData = {
                empresa_id: empresa.id,
                establecimiento: facturacionData.establecimiento,
                punto_emision: facturacionData.punto_emision,
                ambiente: facturacionData.ambiente,
                obligado_contabilidad: facturacionData.obligado_contabilidad,
                contribuyente_especial: facturacionData.contribuyente_especial || null,
                tipo_emision: facturacionData.tipo_emision,
                updated_at: new Date().toISOString(),
            }

            if (sriConfigExists) {
                const { error: sriError } = await supabase
                    .from('sri_configuracion')
                    .update(sriData)
                    .eq('empresa_id', empresa.id)

                if (sriError) throw sriError
            } else {
                const { error: sriError } = await supabase
                    .from('sri_configuracion')
                    .insert({
                        ...sriData,
                        secuencial_factura: 1,
                        secuencial_nota_credito: 1,
                        secuencial_nota_debito: 1,
                        secuencial_retencion: 1,
                        secuencial_guia_remision: 1,
                    })

                if (sriError) throw sriError
                setSriConfigExists(true)
            }

            // Update form data for empresa tab too
            setFormData(f => ({
                ...f,
                nombre: facturacionData.razon_social,
                direccion: facturacionData.direccion_matriz,
            }))

            toast.success('Configuración de facturación guardada')
        } catch (error: any) {
            console.error('Error saving facturacion:', error)
            toast.error('Error al guardar configuración de facturación')
        } finally {
            setIsSavingFacturacion(false)
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
                    <TabsContent value="facturacion" className="mt-6 space-y-6">
                        {/* Section 1: Datos del Emisor */}
                        <Card className="card-linear">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-[hsl(var(--brand-accent))]" />
                                    <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                        Datos del Emisor
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[hsl(var(--text-muted))]">
                                    Información requerida para la facturación electrónica SRI
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Razón Social *</Label>
                                        <Input
                                            value={facturacionData.razon_social}
                                            onChange={(e) => setFacturacionData(f => ({ ...f, razon_social: e.target.value }))}
                                            className="input-linear"
                                            placeholder="Nombre legal de la empresa"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nombre Comercial</Label>
                                        <Input
                                            value={facturacionData.nombre_comercial}
                                            onChange={(e) => setFacturacionData(f => ({ ...f, nombre_comercial: e.target.value }))}
                                            className="input-linear"
                                            placeholder="Nombre comercial (opcional)"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección Matriz *</Label>
                                    <Textarea
                                        value={facturacionData.direccion_matriz}
                                        onChange={(e) => setFacturacionData(f => ({ ...f, direccion_matriz: e.target.value }))}
                                        className="input-linear resize-none"
                                        rows={2}
                                        placeholder="Dirección completa de la matriz"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                                        <div>
                                            <p className="font-medium text-[hsl(var(--text-primary))]">Obligado a llevar contabilidad</p>
                                            <p className="text-sm text-[hsl(var(--text-muted))]">Aparecerá en sus facturas</p>
                                        </div>
                                        <Switch
                                            checked={facturacionData.obligado_contabilidad}
                                            onCheckedChange={(v) => setFacturacionData(f => ({ ...f, obligado_contabilidad: v }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contribuyente Especial</Label>
                                        <Input
                                            value={facturacionData.contribuyente_especial}
                                            onChange={(e) => setFacturacionData(f => ({ ...f, contribuyente_especial: e.target.value }))}
                                            className="input-linear"
                                            placeholder="Nro. Resolución (si aplica)"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 2: Establecimiento */}
                        <Card className="card-linear">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-[hsl(var(--brand-accent))]" />
                                    <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                        Establecimiento
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[hsl(var(--text-muted))]">
                                    Códigos de establecimiento y punto de emisión según SRI
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Código Establecimiento *</Label>
                                        <Input
                                            value={facturacionData.establecimiento}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                                                setFacturacionData(f => ({ ...f, establecimiento: value }))
                                            }}
                                            className="input-linear font-mono"
                                            placeholder="001"
                                            maxLength={3}
                                        />
                                        <p className="text-xs text-[hsl(var(--text-muted))]">3 dígitos (ej: 001)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Punto de Emisión *</Label>
                                        <Input
                                            value={facturacionData.punto_emision}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                                                setFacturacionData(f => ({ ...f, punto_emision: value }))
                                            }}
                                            className="input-linear font-mono"
                                            placeholder="001"
                                            maxLength={3}
                                        />
                                        <p className="text-xs text-[hsl(var(--text-muted))]">3 dígitos (ej: 001)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secuencial Actual</Label>
                                        <div className="flex items-center h-10 px-3 bg-[hsl(var(--surface-highlight))] rounded-lg border border-[hsl(var(--border-subtle))]">
                                            <span className="font-mono text-[hsl(var(--text-secondary))]">
                                                {facturacionData.establecimiento.padStart(3, '0')}-{facturacionData.punto_emision.padStart(3, '0')}-XXXXXXXXX
                                            </span>
                                        </div>
                                        <p className="text-xs text-[hsl(var(--text-muted))]">Formato de numeración</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección del Establecimiento</Label>
                                    <Textarea
                                        value={facturacionData.direccion_establecimiento}
                                        onChange={(e) => setFacturacionData(f => ({ ...f, direccion_establecimiento: e.target.value }))}
                                        className="input-linear resize-none"
                                        rows={2}
                                        placeholder="Dirección de este establecimiento (si es diferente a la matriz)"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 3: Ambiente SRI */}
                        <Card className="card-linear">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-[hsl(var(--brand-accent))]" />
                                    <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                        Ambiente SRI
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[hsl(var(--text-muted))]">
                                    Configuración del ambiente de facturación electrónica
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label>Ambiente</Label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFacturacionData(f => ({ ...f, ambiente: 'pruebas' }))}
                                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${facturacionData.ambiente === 'pruebas'
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border-default))]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertCircle className={`h-4 w-4 ${facturacionData.ambiente === 'pruebas' ? 'text-amber-500' : 'text-[hsl(var(--text-muted))]'}`} />
                                                    <span className={`font-medium ${facturacionData.ambiente === 'pruebas' ? 'text-amber-600' : 'text-[hsl(var(--text-secondary))]'}`}>
                                                        Pruebas
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[hsl(var(--text-muted))] text-left">
                                                    Para testing y desarrollo
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFacturacionData(f => ({ ...f, ambiente: 'produccion' }))}
                                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${facturacionData.ambiente === 'produccion'
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : 'border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border-default))]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle2 className={`h-4 w-4 ${facturacionData.ambiente === 'produccion' ? 'text-green-500' : 'text-[hsl(var(--text-muted))]'}`} />
                                                    <span className={`font-medium ${facturacionData.ambiente === 'produccion' ? 'text-green-600' : 'text-[hsl(var(--text-secondary))]'}`}>
                                                        Producción
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[hsl(var(--text-muted))] text-left">
                                                    Facturas reales con validez legal
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label>Tipo de Emisión</Label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFacturacionData(f => ({ ...f, tipo_emision: '1' }))}
                                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${facturacionData.tipo_emision === '1'
                                                    ? 'border-[hsl(var(--brand-accent))] bg-[hsl(var(--brand-accent))]/10'
                                                    : 'border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border-default))]'
                                                    }`}
                                            >
                                                <span className={`font-medium ${facturacionData.tipo_emision === '1' ? 'text-[hsl(var(--brand-accent))]' : 'text-[hsl(var(--text-secondary))]'}`}>
                                                    Normal
                                                </span>
                                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                                    Emisión estándar
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFacturacionData(f => ({ ...f, tipo_emision: '2' }))}
                                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${facturacionData.tipo_emision === '2'
                                                    ? 'border-[hsl(var(--brand-accent))] bg-[hsl(var(--brand-accent))]/10'
                                                    : 'border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border-default))]'
                                                    }`}
                                            >
                                                <span className={`font-medium ${facturacionData.tipo_emision === '2' ? 'text-[hsl(var(--brand-accent))]' : 'text-[hsl(var(--text-secondary))]'}`}>
                                                    Contingencia
                                                </span>
                                                <p className="text-xs text-[hsl(var(--text-muted))]">
                                                    Sistema SRI no disponible
                                                </p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 4: Certificado Digital */}
                        <Card className="card-linear">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileKey className="h-5 w-5 text-[hsl(var(--brand-accent))]" />
                                    <CardTitle className="text-lg text-[hsl(var(--text-primary))]">
                                        Certificado Digital (.p12)
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[hsl(var(--text-muted))]">
                                    Firma electrónica para validar comprobantes con el SRI
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Status */}
                                <div className="flex items-center gap-4 p-4 bg-[hsl(var(--surface-highlight))] rounded-lg border border-[hsl(var(--border-subtle))]">
                                    {firmaStatus.configurada ? (
                                        <>
                                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10">
                                                <ShieldCheck className="h-6 w-6 text-green-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[hsl(var(--text-primary))]">
                                                    Certificado configurado
                                                    {firmaStatus.commonName && (
                                                        <span className="font-normal text-[hsl(var(--text-secondary))]"> - {firmaStatus.commonName}</span>
                                                    )}
                                                </p>
                                                {firmaStatus.vence && (
                                                    <p className="text-sm text-[hsl(var(--text-muted))]">
                                                        Vence: {new Date(firmaStatus.vence).toLocaleDateString('es-EC', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                                onClick={handleRemoveCertificate}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Eliminar
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10">
                                                <Info className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[hsl(var(--text-primary))]">Sin certificado configurado</p>
                                                <p className="text-sm text-[hsl(var(--text-muted))]">
                                                    Suba su certificado .p12 para firmar facturas electrónicas
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Upload Form */}
                                {!firmaStatus.configurada && (
                                    <div className="space-y-4 p-4 border border-dashed border-[hsl(var(--border-default))] rounded-lg">
                                        <div className="space-y-2">
                                            <Label>Archivo de Certificado (.p12 / .pfx)</Label>
                                            <div className="flex gap-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".p12,.pfx"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    id="p12-upload"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1 border-[hsl(var(--border-subtle))]"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {p12File ? p12File.name : 'Seleccionar archivo...'}
                                                </Button>
                                                {p12File && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setP12File(null)
                                                            setCertValidation(null)
                                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {p12File && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>Contraseña del Certificado</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={p12Password}
                                                            onChange={(e) => setP12Password(e.target.value)}
                                                            className="input-linear pr-10"
                                                            placeholder="Ingrese la contraseña"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Validation Result */}
                                                {certValidation && (
                                                    <div className={`p-3 rounded-lg ${certValidation.validated ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                                        {certValidation.validated && certValidation.info ? (
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-green-600 flex items-center gap-2">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Certificado Válido
                                                                </p>
                                                                <p className="text-sm text-[hsl(var(--text-secondary))]">Titular: {certValidation.info.commonName}</p>
                                                                <p className="text-sm text-[hsl(var(--text-secondary))]">Emisor: {certValidation.info.issuer}</p>
                                                                <p className="text-sm text-[hsl(var(--text-secondary))]">
                                                                    Válido hasta: {certValidation.info.validTo.toLocaleDateString('es-EC')}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-red-600 flex items-center gap-2">
                                                                <AlertCircle className="h-4 w-4" />
                                                                {certValidation.error}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    {!certValidation?.validated ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={handleValidateCertificate}
                                                            disabled={!p12Password}
                                                            className="border-[hsl(var(--border-subtle))]"
                                                        >
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            Validar Certificado
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            onClick={handleUploadCertificate}
                                                            disabled={isUploadingCert}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            {isUploadingCert ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 mr-2" />
                                                            )}
                                                            Guardar Certificado
                                                        </Button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    El certificado se almacena de forma segura y encriptada
                                </p>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveFacturacion}
                                disabled={isSavingFacturacion}
                                className="gap-2 bg-[hsl(var(--brand-accent))]"
                            >
                                {isSavingFacturacion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar Configuración de Facturación
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    )
}

