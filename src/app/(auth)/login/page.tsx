'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
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
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error('Error al iniciar sesión', {
                    description: error.message,
                })
                return
            }

            if (data.user?.user_metadata?.is_super_admin) {
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
                    <CardHeader className="text-center space-y-1 pb-2 pt-8">
                        <CardTitle className="text-xl font-semibold text-slate-900 tracking-tight">
                            Bienvenido de nuevo
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Ingresa tus credenciales para continuar
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-5 px-8">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                    Correo electrónico
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors duration-200" strokeWidth={1.5} />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all duration-200 text-[15px]"
                                        required
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
                                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-600 transition-colors duration-200" strokeWidth={1.5} />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-[52px] bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all duration-200 text-[15px]"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-5 pt-4 pb-8 px-8">
                            <Button
                                type="submit"
                                className="w-full h-[52px] bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.25)] rounded-xl transition-all duration-200 active:scale-[0.98] text-[15px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Iniciar sesión
                                        <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                                    </>
                                )}
                            </Button>

                            <p className="text-sm text-center text-slate-500">
                                ¿No tienes cuenta?{' '}
                                <Link
                                    href="/register"
                                    className="text-slate-900 hover:underline font-medium transition-colors"
                                >
                                    Regístrate gratis
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>

                {/* Footer */}
                <p className="mt-10 text-center text-xs text-slate-400 tracking-wide">
                    RepairApp © {new Date().getFullYear()} · Ecuador
                </p>
            </motion.div>
        </div>
    )
}
