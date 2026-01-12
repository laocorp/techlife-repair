'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message === 'Invalid login credentials'
                    ? 'Credenciales inválidas. Verifica tu email y contraseña.'
                    : authError.message)
                return
            }

            router.push(redirectTo)
            router.refresh()
        } catch {
            setError('Error al iniciar sesión. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="animate-fade-in">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                <CardDescription>
                    Ingresa tus credenciales para acceder a tu cuenta
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
                        label="Correo electrónico"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <div className="flex justify-end">
                        <Link
                            href="/forgot-password"
                            className="text-sm text-primary hover:text-primary-hover"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-4">
                    <Button type="submit" className="w-full" loading={loading}>
                        Iniciar Sesión
                    </Button>

                    <p className="text-sm text-foreground-secondary">
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className="text-primary hover:text-primary-hover font-medium">
                            Regístrate gratis
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <Card className="animate-pulse">
                <CardHeader className="text-center">
                    <div className="h-6 bg-background-secondary rounded w-32 mx-auto" />
                    <div className="h-4 bg-background-secondary rounded w-48 mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-10 bg-background-secondary rounded" />
                    <div className="h-10 bg-background-secondary rounded" />
                </CardContent>
            </Card>
        }>
            <LoginForm />
        </Suspense>
    )
}
