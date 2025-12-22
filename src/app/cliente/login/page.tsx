// src/app/cliente/login/page.tsx
// Customer login - simplified version without Supabase Auth
// TODO: Implement proper magic link or password auth for clients

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Wrench,
    Mail,
    Loader2,
    ArrowLeft,
    Search,
} from 'lucide-react'

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
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--surface-base))] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back to main */}
                <Link href="/" className="inline-flex items-center gap-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio
                </Link>

                <Card className="card-linear">
                    <CardHeader className="text-center pb-2">
                        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wrench className="h-7 w-7 text-white" />
                        </div>
                        <CardTitle className="text-xl text-[hsl(var(--text-primary))]">
                            Portal de Clientes
                        </CardTitle>
                        <CardDescription className="text-[hsl(var(--text-muted))]">
                            Consulta el estado de tus equipos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[hsl(var(--text-secondary))]">
                                    Email registrado
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--text-muted))]" />
                                    <Input
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 input-linear"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        Acceder al Portal
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                Ingresa el email con el que registraste tu equipo
                                para ver el estado de tus reparaciones.
                            </p>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                ¿No tienes cuenta?{' '}
                                <span className="text-[hsl(var(--text-secondary))]">
                                    Se crea automáticamente al dejar un equipo
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
