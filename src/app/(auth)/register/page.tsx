'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
    Wrench,
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Building2,
    User,
    Phone,
    CheckCircle,
    MapPin
} from 'lucide-react'

const steps = [
    { id: 1, title: 'Empresa', icon: Building2 },
    { id: 2, title: 'Cuenta', icon: User },
    { id: 3, title: 'Confirmar', icon: CheckCircle },
]

export default function RegisterPage() {
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        empresaNombre: '',
        empresaRuc: '',
        empresaTelefono: '',
        empresaDireccion: '',
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNext = () => {
        if (currentStep === 1) {
            if (!formData.empresaNombre || !formData.empresaRuc) {
                toast.error('Completa los campos requeridos')
                return
            }
            if (formData.empresaRuc.length !== 13) {
                toast.error('El RUC debe tener 13 dígitos')
                return
            }
        }
        if (currentStep === 2) {
            if (!formData.nombre || !formData.email || !formData.password) {
                toast.error('Completa todos los campos')
                return
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error('Las contraseñas no coinciden')
                return
            }
            if (formData.password.length < 6) {
                toast.error('La contraseña debe tener al menos 6 caracteres')
                return
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, 3))
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleRegister = async () => {
        setIsLoading(true)

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        nombre: formData.nombre,
                    }
                }
            })

            if (authError) throw authError

            if (authData.user) {
                const { data: result, error: rpcError } = await supabase.rpc(
                    'register_empresa_and_admin',
                    {
                        p_user_id: authData.user.id,
                        p_user_nombre: formData.nombre,
                        p_user_email: formData.email,
                        p_empresa_nombre: formData.empresaNombre,
                        p_empresa_ruc: formData.empresaRuc,
                        p_empresa_telefono: formData.empresaTelefono || null,
                        p_empresa_direccion: formData.empresaDireccion || null,
                    }
                )

                if (rpcError) {
                    console.error('RPC Error:', rpcError)
                    throw new Error(rpcError.message)
                }

                if (result && !result.success) {
                    throw new Error(result.error || 'Error al crear empresa')
                }

                toast.success('¡Cuenta creada exitosamente!', {
                    description: 'Revisa tu email para confirmar tu cuenta.',
                })
                router.push('/login')
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            toast.error('Error al crear la cuenta', {
                description: error.message || 'Intenta nuevamente',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            {/* Subtle background pattern */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center gap-3 mb-6"
                >
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">RepairApp</h1>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-1 mb-6">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : isActive
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-200 text-slate-400'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 ${isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 mb-5 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                <Card className="border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                            {currentStep === 1 && 'Datos de tu empresa'}
                            {currentStep === 2 && 'Crea tu cuenta'}
                            {currentStep === 3 && 'Confirma tus datos'}
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            {currentStep === 1 && 'Ingresa la información de tu servicio técnico'}
                            {currentStep === 2 && 'Serás el administrador principal'}
                            {currentStep === 3 && 'Revisa que todo esté correcto'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Empresa */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Nombre de la empresa *</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Servicio Técnico ABC"
                                                value={formData.empresaNombre}
                                                onChange={(e) => updateField('empresaNombre', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">RUC *</Label>
                                        <Input
                                            placeholder="1234567890001"
                                            maxLength={13}
                                            value={formData.empresaRuc}
                                            onChange={(e) => updateField('empresaRuc', e.target.value.replace(/\D/g, ''))}
                                            className="h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="0999999999"
                                                value={formData.empresaTelefono}
                                                onChange={(e) => updateField('empresaTelefono', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Dirección</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Av. Principal y Calle Secundaria"
                                                value={formData.empresaDireccion}
                                                onChange={(e) => updateField('empresaDireccion', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Usuario */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Tu nombre *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Juan Pérez"
                                                value={formData.nombre}
                                                onChange={(e) => updateField('nombre', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Correo electrónico *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="email"
                                                placeholder="correo@empresa.com"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Confirmar contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Confirmación */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                            <Building2 className="w-4 h-4" />
                                            Empresa
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            <div className="text-slate-500">Nombre:</div>
                                            <div className="text-slate-900 font-medium">{formData.empresaNombre}</div>
                                            <div className="text-slate-500">RUC:</div>
                                            <div className="text-slate-900">{formData.empresaRuc}</div>
                                            {formData.empresaTelefono && (
                                                <>
                                                    <div className="text-slate-500">Teléfono:</div>
                                                    <div className="text-slate-900">{formData.empresaTelefono}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                            <User className="w-4 h-4" />
                                            Administrador
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            <div className="text-slate-500">Nombre:</div>
                                            <div className="text-slate-900 font-medium">{formData.nombre}</div>
                                            <div className="text-slate-500">Email:</div>
                                            <div className="text-slate-900">{formData.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-emerald-700 font-medium">Prueba gratuita de 14 días</p>
                                            <p className="text-emerald-600 mt-0.5">
                                                Acceso completo a todas las funciones sin costo.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">
                        <div className="flex gap-3 w-full">
                            {currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Atrás
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white"
                                >
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creando cuenta...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Crear cuenta
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-sm text-center text-slate-500">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-slate-900 hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Al registrarte aceptas nuestros términos y condiciones
                </p>
            </motion.div>
        </div>
    )
}
