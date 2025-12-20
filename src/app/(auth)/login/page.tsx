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
import { Wrench, Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react'

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

            // Check if user is super admin
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"
                />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="flex items-center justify-center gap-3 mb-8"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Wrench className="w-8 h-8 text-white" />
                    </div>
                </motion.div>

                <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/20">
                    <CardHeader className="text-center space-y-2 pb-6">
                        <CardTitle className="text-2xl font-bold text-white">
                            Bienvenido de nuevo
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Ingresa tus credenciales para continuar
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                                    Correo electrónico
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                                        Contraseña
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Iniciar sesión
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-slate-500">o</span>
                                </div>
                            </div>

                            <p className="text-sm text-center text-slate-400">
                                ¿No tienes cuenta?{' '}
                                <Link
                                    href="/register"
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Regístrate gratis
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>

                {/* Features hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Servicio Técnico Autorizado · Facturación SRI Ecuador</span>
                </motion.div>
            </motion.div>
        </div>
    )
}
