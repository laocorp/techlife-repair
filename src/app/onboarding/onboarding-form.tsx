'use client'

import { useActionState } from 'react'
import { useState, useEffect } from 'react'
import { completeOnboarding, type OnboardingFormState } from '@/actions/onboarding'
import { Building2, CheckCircle, Loader2, ArrowRight } from 'lucide-react'

interface OnboardingFormProps {
    defaultFullName: string
    defaultEmail: string
    defaultCompanyName: string
}

const initialState: OnboardingFormState = {}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export function OnboardingForm({ defaultFullName, defaultEmail, defaultCompanyName }: OnboardingFormProps) {
    const [state, formAction, isPending] = useActionState(completeOnboarding, initialState)
    const [companyName, setCompanyName] = useState(defaultCompanyName)
    const [slug, setSlug] = useState(generateSlug(defaultCompanyName))
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    useEffect(() => {
        if (!slugManuallyEdited) {
            setSlug(generateSlug(companyName))
        }
    }, [companyName, slugManuallyEdited])

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlugManuallyEdited(true)
        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    }

    return (
        <form action={formAction} className="space-y-6">
            {state.errors?._form && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    {state.errors._form.join(', ')}
                </div>
            )}

            {/* Company Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5" />
                    Empresa
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Nombre de la Empresa</label>
                    <input
                        name="company_name"
                        type="text"
                        placeholder="Mi Empresa S.A."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    {state.errors?.company_name && (
                        <p className="text-xs text-red-400">{state.errors.company_name.join(', ')}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">URL de tu empresa</label>
                    <div className="flex items-center gap-0">
                        <span className="h-9 px-3 rounded-l-md bg-zinc-950 border border-zinc-800/40 border-r-0 text-sm text-zinc-500 flex items-center">
                            {(process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000').replace(/^https?:\/\//, '')}/
                        </span>
                        <input
                            name="slug"
                            type="text"
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="mi-empresa"
                            required
                            className="flex-1 h-9 px-3 rounded-r-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                    </div>
                    {state.errors?.slug && (
                        <p className="text-xs text-red-400">{state.errors.slug.join(', ')}</p>
                    )}
                    <p className="text-[10px] text-zinc-600">Solo letras, números y guiones</p>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-800" />

            {/* User Info */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Tu Nombre</label>
                    <input
                        name="full_name"
                        type="text"
                        placeholder="Juan Pérez"
                        defaultValue={defaultFullName}
                        required
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    {state.errors?.full_name && (
                        <p className="text-xs text-red-400">{state.errors.full_name.join(', ')}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Email</label>
                    <input
                        type="email"
                        value={defaultEmail}
                        disabled
                        className="w-full h-9 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-500 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Teléfono (opcional)</label>
                    <input
                        name="phone"
                        type="text"
                        placeholder="+593 999 999 999"
                        className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800/40 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                </div>
            </div>

            {/* Plan Info */}
            <div className="rounded-lg bg-zinc-900 p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium">Plan Starter — 14 días gratis</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Hasta 3 usuarios, órdenes de trabajo e informes técnicos incluidos.
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full h-9 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        Crear Empresa
                        <ArrowRight className="h-3.5 w-3.5" />
                    </>
                )}
            </button>
        </form>
    )
}
