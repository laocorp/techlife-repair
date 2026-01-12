'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        companyName: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            // Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        company_name: formData.companyName,
                    },
                },
            })

            if (authError) {
                setError(authError.message)
                return
            }

            if (authData.user) {
                setSuccess(true)
                // If email confirmation is disabled, redirect to dashboard
                if (authData.session) {
                    router.push('/onboarding')
                }
            }
        } catch {
            setError('Error al crear la cuenta. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="animate-fade-in">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success-light flex items-center justify-center">
                        <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <CardTitle className="text-xl">¡Cuenta creada!</CardTitle>
                    <CardDescription>
                        Revisa tu correo electrónico para confirmar tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Link href="/login">
                        <Button variant="outline">Ir a Iniciar Sesión</Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="animate-fade-in">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Crear Cuenta</CardTitle>
                <CardDescription>
                    Comienza tu prueba gratuita de 14 días
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nombre de la Empresa"
                        name="companyName"
                        placeholder="Mi Empresa S.A."
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Tu Nombre Completo"
                        name="fullName"
                        placeholder="Juan Pérez"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                    />

                    <Input
                        label="Contraseña"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        hint="Mínimo 8 caracteres"
                    />

                    <Input
                        label="Confirmar Contraseña"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                    />
                </CardContent>

                <CardFooter className="flex-col gap-4">
                    <Button type="submit" className="w-full" loading={loading}>
                        Crear Cuenta
                    </Button>

                    <p className="text-sm text-foreground-secondary text-center">
                        Al registrarte, aceptas nuestros{' '}
                        <Link href="/terms" className="text-primary hover:text-primary-hover">
                            Términos de Servicio
                        </Link>{' '}
                        y{' '}
                        <Link href="/privacy" className="text-primary hover:text-primary-hover">
                            Política de Privacidad
                        </Link>
                    </p>

                    <p className="text-sm text-foreground-secondary">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
                            Inicia Sesión
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
