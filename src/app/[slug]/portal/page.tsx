'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, KeyRound, User } from 'lucide-react'

type Step = 'email' | 'code'

export default function ClientPortalPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [clientId, setClientId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/public/portal/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, slug })
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Error al enviar el código')
                return
            }

            setClientId(data.client_id)
            setStep('code')
        } catch {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/public/portal/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: clientId, code })
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Código inválido')
                return
            }

            // Store client session in cookie/localStorage
            localStorage.setItem('client_session', JSON.stringify({
                client_id: data.client.id,
                name: data.client.name,
                email: data.client.email,
                tenant_slug: slug,
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            }))

            router.push(`/${slug}/portal/orders`)
        } catch {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased">
            {/* Header */}
            <header className="py-6 px-6">
                <div className="max-w-sm mx-auto">
                    <Link
                        href={`/${slug}`}
                        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Volver
                    </Link>
                </div>
            </header>

            {/* Main */}
            <main className="py-8 px-6">
                <div className="max-w-sm mx-auto">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                            <User className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h1 className="text-xl font-medium mb-2">Portal de Cliente</h1>
                        <p className="text-sm text-zinc-500">
                            {step === 'email'
                                ? 'Ingresa tu email para recibir un código de acceso'
                                : 'Ingresa el código que enviamos a tu email'
                            }
                        </p>
                    </div>

                    {step === 'email' ? (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Enviar Código'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-zinc-400">Código de 6 dígitos</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        required
                                        maxLength={6}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 tracking-[0.5em] text-center font-mono"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full h-10 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Verificar'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                Usar otro email
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    )
}
