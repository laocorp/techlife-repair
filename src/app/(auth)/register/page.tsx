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
    Loader2,
    Building2,
    User,
    Phone,
    CheckCircle,
    Sparkles
} from 'lucide-react'

const steps = [
    { id: 1, title: 'Tu empresa', icon: Building2 },
    { id: 2, title: 'Tu cuenta', icon: User },
    { id: 3, title: 'Confirmar', icon: CheckCircle },
]

export default function RegisterPage() {
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Form data
    const [formData, setFormData] = useState({
        // Empresa
        empresaNombre: '',
        empresaRuc: '',
        empresaTelefono: '',
        empresaDireccion: '',
        // Usuario
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
            // 1. Create auth user first
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
                // 2. Use RPC function to create empresa and user profile atomically
                // This bypasses RLS safely
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
        <div className="min-h-screen flex items-center justify-center bg-[hsl(220,15%,4%)] p-4 relative overflow-hidden">
            {/* Animated background - Enterprise theme */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <Wrench className="w-7 h-7 text-zinc-900" />
                    </div>
                    <span className="text-2xl font-bold text-white">RepairApp</span>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        backgroundColor: isCompleted ? 'rgb(34, 197, 94)' : isActive ? 'rgb(6, 182, 212)' : 'rgb(39, 39, 42)'
                                    }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-zinc-700'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                <Card className="border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-black/50">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl font-bold text-white">
                            {currentStep === 1 && 'Datos de tu empresa'}
                            {currentStep === 2 && 'Crea tu cuenta'}
                            {currentStep === 3 && 'Confirma tus datos'}
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            {currentStep === 1 && 'Ingresa la información de tu servicio técnico'}
                            {currentStep === 2 && 'Serás el administrador principal'}
                            {currentStep === 3 && 'Revisa que todo esté correcto'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
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
                                        <Label className="text-zinc-300">Nombre de la empresa *</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                placeholder="Servicio Técnico ABC"
                                                value={formData.empresaNombre}
                                                onChange={(e) => updateField('empresaNombre', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">RUC *</Label>
                                        <Input
                                            placeholder="1234567890001"
                                            maxLength={13}
                                            value={formData.empresaRuc}
                                            onChange={(e) => updateField('empresaRuc', e.target.value.replace(/\D/g, ''))}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                placeholder="0999999999"
                                                value={formData.empresaTelefono}
                                                onChange={(e) => updateField('empresaTelefono', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Dirección</Label>
                                        <Input
                                            placeholder="Av. Principal y Calle Secundaria"
                                            value={formData.empresaDireccion}
                                            onChange={(e) => updateField('empresaDireccion', e.target.value)}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                        />
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
                                        <Label className="text-zinc-300">Tu nombre *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                placeholder="Juan Pérez"
                                                value={formData.nombre}
                                                onChange={(e) => updateField('nombre', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Correo electrónico *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                type="email"
                                                placeholder="correo@empresa.com"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Confirmar contraseña *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
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
                                    className="space-y-6"
                                >
                                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                            <Building2 className="w-4 h-4" />
                                            Empresa
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-zinc-400">Nombre:</div>
                                            <div className="text-white font-medium">{formData.empresaNombre}</div>
                                            <div className="text-zinc-400">RUC:</div>
                                            <div className="text-white font-medium">{formData.empresaRuc}</div>
                                            {formData.empresaTelefono && (
                                                <>
                                                    <div className="text-zinc-400">Teléfono:</div>
                                                    <div className="text-white">{formData.empresaTelefono}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-purple-400 font-medium">
                                            <User className="w-4 h-4" />
                                            Administrador
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-zinc-400">Nombre:</div>
                                            <div className="text-white font-medium">{formData.nombre}</div>
                                            <div className="text-zinc-400">Email:</div>
                                            <div className="text-white">{formData.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-green-400 font-medium">Prueba gratuita de 14 días</p>
                                            <p className="text-zinc-400 mt-1">
                                                Tendrás acceso a todas las funciones sin costo durante el período de prueba.
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
                                    className="flex-1 border-white/10 text-white hover:bg-white/5"
                                >
                                    Atrás
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500"
                                >
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
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

                        <p className="text-sm text-center text-zinc-400">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-cyan-400 hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-zinc-500 mt-6">
                    Al registrarte aceptas nuestros términos y condiciones
                </p>
            </motion.div>
        </div>
    )
}

