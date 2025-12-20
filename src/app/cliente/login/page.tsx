// src/app/cliente/login/page.tsx
// Customer login with magic link (no password)

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Wrench,
    Mail,
    Loader2,
    CheckCircle,
    ArrowLeft,
    Sparkles,
} from 'lucide-react'

export default function ClienteLoginPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isEmailSent, setIsEmailSent] = useState(false)
    const supabase = createClient()

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Ingresa tu email')
            return
        }

        setIsLoading(true)
        try {
            // Check if email exists as a cliente
            const { data: cliente, error: clienteError } = await supabase
                .from('clientes')
                .select('id, email')
                .eq('email', email.toLowerCase())
                .single()

            if (clienteError || !cliente) {
                toast.error('Email no encontrado', {
                    description: 'Este email no está registrado como cliente'
                })
                setIsLoading(false)
                return
            }

            // Send magic link
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                    emailRedirectTo: `${window.location.origin}/cliente`,
                }
            })

            if (error) throw error

            setIsEmailSent(true)
            toast.success('¡Enlace enviado!', {
                description: 'Revisa tu email para acceder'
            })
        } catch (error: any) {
            toast.error('Error al enviar enlace', { description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    if (isEmailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--surface-base))] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="card-linear border-emerald-500/20">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-[hsl(var(--text-primary))] mb-2">
                                ¡Revisa tu email!
                            </h2>
                            <p className="text-[hsl(var(--text-muted))] mb-6">
                                Enviamos un enlace mágico a <strong className="text-[hsl(var(--text-primary))]">{email}</strong>.
                                Haz clic en el enlace para acceder a tu portal.
                            </p>
                            <div className="bg-[hsl(var(--surface-highlight))] rounded-lg p-4 mb-6">
                                <p className="text-sm text-[hsl(var(--text-muted))]">
                                    <strong>Tip:</strong> El enlace expira en 1 hora.
                                    Revisa también tu carpeta de spam.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsEmailSent(false)}
                                className="w-full border-[hsl(var(--border-subtle))]"
                            >
                                Enviar otro enlace
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
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
                        <form onSubmit={handleMagicLink} className="space-y-4">
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
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Enviar Enlace Mágico
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-[hsl(var(--surface-highlight))] rounded-lg">
                            <p className="text-sm text-[hsl(var(--text-muted))]">
                                <Sparkles className="inline h-4 w-4 mr-1 text-blue-400" />
                                <strong>Sin contraseña:</strong> Te enviamos un enlace seguro
                                a tu email para acceder directamente.
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
