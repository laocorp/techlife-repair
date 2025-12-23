// src/app/cliente/login/page.tsx
// Customer login - premium glass redesign

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Wrench,
    Mail,
    Loader2,
    ArrowLeft,
    Search,
} from 'lucide-react'
import { PremiumBackground } from '@/components/ui/premium-background'

export default function ClienteLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Ingresa tu email')
            return
        }

        setIsLoading(true)
        try {
            // Check if email exists as a cliente
            const response = await fetch(`/api/clientes?email=${encodeURIComponent(email.toLowerCase())}`)
            const data = await response.json()

            if (!response.ok || !data.cliente) {
                toast.error('Email no encontrado', {
                    description: 'Este email no está registrado como cliente'
                })
                setIsLoading(false)
                return
            }

            // Store client info in localStorage for the portal
            localStorage.setItem('cliente_portal', JSON.stringify({
                id: data.cliente.id,
                nombre: data.cliente.nombre,
                email: data.cliente.email,
                empresa_id: data.cliente.empresa_id
            }))

            toast.success('¡Bienvenido!', {
                description: `Hola ${data.cliente.nombre}`
            })

            router.push('/cliente')
        } catch (error: any) {
            toast.error('Error al verificar email', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
            <PremiumBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back to main */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group pl-2"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Volver al inicio</span>
                </Link>

                <Card className="border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl shadow-slate-200/50">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-6 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 rotate-3 transition-transform hover:rotate-6 duration-300">
                                <Wrench className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Portal de Clientes
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Consulta el estado de tus equipos y reparaciones
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium ml-1">
                                    Email registrado
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-white/50 border-slate-200 focus:bg-white focus:border-slate-400 transition-all rounded-xl"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-5 w-5 mr-2" />
                                        Acceder al Portal
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Ingresa con el email que proporcionaste al dejar tu equipo en el taller.
                                No necesitas contraseña.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
