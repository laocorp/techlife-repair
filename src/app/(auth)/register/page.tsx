'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2, Check } from 'lucide-react'

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
                if (authData.session) {
                    router.push('/onboarding')
                }
            }
        } catch {
            setError('Error al crear la cuenta')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-xl font-medium mb-2">¡Cuenta creada!</h1>
                    <p className="text-sm text-zinc-500">
                        Revisa tu correo para confirmar tu cuenta.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium items-center gap-2 transition-colors"
                >
                    Ir a Iniciar Sesión
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-xl font-medium mb-2">Crear Cuenta</h1>
                <p className="text-sm text-zinc-500">
                    Prueba gratuita de 14 días
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
                    <label className="text-xs text-zinc-400">Nombre de la Empresa</label>
                    <input
                        type="text"
                        name="companyName"
                        placeholder="Mi Empresa S.A."
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Tu Nombre</label>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Juan Pérez"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Correo Electrónico</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Contraseña</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <p className="text-[10px] text-zinc-600">Mínimo 8 caracteres</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Confirmar Contraseña</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        autoComplete="new-password"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
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
                            Crear Cuenta
                            <ArrowRight className="h-3.5 w-3.5" />
                        </>
                    )}
                </button>

                <p className="text-[10px] text-zinc-600 text-center">
                    Al registrarte, aceptas nuestros{' '}
                    <Link href="/terms" className="text-zinc-400 hover:text-zinc-100">Términos</Link>
                    {' '}y{' '}
                    <Link href="/privacy" className="text-zinc-400 hover:text-zinc-100">Privacidad</Link>
                </p>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-zinc-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-zinc-100 hover:underline">
                    Inicia Sesión
                </Link>
            </p>
        </div>
    )
}
