'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    empresaNombre: formData.empresaNombre,
                    empresaRuc: formData.empresaRuc,
                    empresaTelefono: formData.empresaTelefono || null,
                    empresaDireccion: formData.empresaDireccion || null,
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear cuenta')
            }

            toast.success('¡Cuenta creada exitosamente!', {
                description: 'Ahora puedes iniciar sesión.',
            })
            router.push('/login')
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#fafafa]">
            {/* Premium subtle gradient background */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />

            {/* Elegant ambient lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-gradient-to-br from-slate-200/50 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-[300px] -left-[300px] w-[800px] h-[800px] bg-gradient-to-tr from-slate-200/40 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Subtle noise texture */}
            <div
                className="fixed inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[480px] relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="flex flex-col items-center justify-center gap-3 mb-8"
                >
                    <motion.div
                        className="w-16 h-16 bg-slate-900 rounded-[18px] flex items-center justify-center shadow-[0_16px_40px_-8px_rgba(0,0,0,0.3)]"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Wrench className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </motion.div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">RepairApp</h1>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-1 mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                            ? 'bg-slate-900 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]'
                                            : isActive
                                                ? 'bg-slate-900 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]'
                                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                                            }`}
                                        whileHover={isActive ? { scale: 1.05 } : {}}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
                                        ) : (
                                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                                        )}
                                    </motion.div>
                                    <span className={`text-xs mt-2 font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-14 h-[2px] mx-3 mb-6 rounded-full transition-colors duration-300 ${isCompleted ? 'bg-slate-900' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Premium Card */}
                <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden">
                    <CardHeader className="text-center pb-2 pt-8">
                        <CardTitle className="text-xl font-semibold text-slate-900 tracking-tight">
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

                    <CardContent className="pt-6 px-8">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Empresa */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Nombre de la empresa *</Label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                placeholder="Servicio Técnico ABC"
                                                value={formData.empresaNombre}
                                                onChange={(e) => updateField('empresaNombre', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">RUC *</Label>
                                        <Input
                                            placeholder="1234567890001"
                                            maxLength={13}
                                            value={formData.empresaRuc}
                                            onChange={(e) => updateField('empresaRuc', e.target.value.replace(/\D/g, ''))}
                                            className="h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Teléfono</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                placeholder="0999999999"
                                                value={formData.empresaTelefono}
                                                onChange={(e) => updateField('empresaTelefono', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Dirección</Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                placeholder="Av. Principal y Calle Secundaria"
                                                value={formData.empresaDireccion}
                                                onChange={(e) => updateField('empresaDireccion', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
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
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Tu nombre *</Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                placeholder="Juan Pérez"
                                                value={formData.nombre}
                                                onChange={(e) => updateField('nombre', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Correo electrónico *</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                type="email"
                                                placeholder="correo@empresa.com"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Contraseña *</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700">Confirmar contraseña *</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors" strokeWidth={1.5} />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-[15px]"
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
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
                                            <Building2 className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                                            Empresa
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-slate-500">Nombre:</div>
                                            <div className="text-slate-900 font-medium">{formData.empresaNombre}</div>
                                            <div className="text-slate-500">RUC:</div>
                                            <div className="text-slate-700">{formData.empresaRuc}</div>
                                            {formData.empresaTelefono && (
                                                <>
                                                    <div className="text-slate-500">Teléfono:</div>
                                                    <div className="text-slate-700">{formData.empresaTelefono}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
                                            <User className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                                            Administrador
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-slate-500">Nombre:</div>
                                            <div className="text-slate-900 font-medium">{formData.nombre}</div>
                                            <div className="text-slate-500">Email:</div>
                                            <div className="text-slate-700">{formData.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-5 bg-slate-900 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <div className="text-sm">
                                            <p className="text-white font-medium">Prueba gratuita de 14 días</p>
                                            <p className="text-slate-300 mt-1">
                                                Acceso completo a todas las funciones sin costo.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-5 pt-6 pb-8 px-8">
                        <div className="flex gap-3 w-full">
                            {currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 h-[52px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all text-[15px]"
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" strokeWidth={1.5} />
                                    Atrás
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] rounded-xl transition-all active:scale-[0.98] text-[15px]"
                                >
                                    Continuar
                                    <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className="flex-1 h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] rounded-xl transition-all active:scale-[0.98] text-[15px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Creando cuenta...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-5 w-5" strokeWidth={1.5} />
                                            Crear cuenta
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-sm text-center text-slate-500">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-slate-900 hover:underline font-medium transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-8 tracking-wide">
                    Al registrarte aceptas nuestros términos y condiciones
                </p>
            </motion.div>
        </div>
    )
}
