'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2 } from 'lucide-react'

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
                    ? 'Credenciales inválidas'
                    : authError.message)
                return
            }

            router.push(redirectTo)
            router.refresh()
        } catch {
            setError('Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-xl font-medium mb-2">Iniciar Sesión</h1>
                <p className="text-sm text-zinc-500">
                    Ingresa a tu cuenta
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Correo electrónico</label>
                    <input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Contraseña</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            Iniciar Sesión
                            <ArrowRight className="h-3.5 w-3.5" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-zinc-500">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-zinc-100 hover:underline">
                    Regístrate gratis
                </Link>
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
