'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Wrench, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { setUser, setEmpresa } = useAuthStore()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error('Error al iniciar sesión', {
                    description: data.error || 'Credenciales inválidas',
                })
                return
            }

            // Guardar en el store
            setUser({
                id: data.user.id,
                email: data.user.email,
                nombre: data.user.nombre,
                rol: data.user.rol,
                empresa_id: data.user.empresa_id,
                activo: true,
                created_at: new Date().toISOString(),
            })

            setEmpresa({
                id: data.user.empresa.id,
                nombre: data.user.empresa.nombre,
                ruc: '',
                logo_url: data.user.empresa.logo_url,
                plan: data.user.empresa.plan,
                suscripcion_activa: true,
                ambiente_sri: 'pruebas',
                punto_emision: '001',
                establecimiento: '001',
                created_at: new Date().toISOString(),
            })

            // Redirigir según rol
            if (data.user.rol === 'superadmin') {
                router.push('/superadmin')
            } else {
                router.push('/')
            }
            router.refresh()
            toast.success('¡Bienvenido!')
        } catch {
            toast.error('Error inesperado')
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-slate-100/60 to-transparent rounded-full blur-2xl" />
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
                className="w-full max-w-[420px] relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center justify-center gap-4 mb-10"
                >
                    <motion.div
                        className="w-[72px] h-[72px] bg-slate-900 rounded-[20px] flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <Wrench className="w-9 h-9 text-white" strokeWidth={1.5} />
                    </motion.div>
                    <div className="text-center">
                        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">RepairApp</h1>
                        <p className="text-sm text-slate-500 mt-1">Sistema de Gestión Profesional</p>
                    </div>
                </motion.div>

                {/* Premium Card */}
                <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-4 pt-8 px-8">
                        <CardTitle className="text-xl font-semibold text-slate-900">
                            Iniciar Sesión
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Ingresa tus credenciales para acceder
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-6">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                    Correo electrónico
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                        Contraseña
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all"
                                    />
                                </div>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="pt-2"
                            >
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-[15px] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)] transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Iniciando sesión...
                                        </>
                                    ) : (
                                        <>
                                            Iniciar Sesión
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-2">
                        <p className="text-sm text-center w-full text-slate-500">
                            ¿No tienes una cuenta?{' '}
                            <Link
                                href="/register"
                                className="font-medium text-slate-900 hover:underline underline-offset-4"
                            >
                                Registrarse
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-center text-xs text-slate-400 mt-8"
                >
                    © 2025 RepairApp. Todos los derechos reservados.
                </motion.p>
            </motion.div>
        </div>
    )
}
