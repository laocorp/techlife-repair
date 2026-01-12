'use client'

import { useActionState } from 'react'
import { useState, useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { completeOnboarding, type OnboardingFormState } from '@/actions/onboarding'
import { Building2, User, Link as LinkIcon, CheckCircle } from 'lucide-react'

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
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-') // Replace multiple dashes
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Información de la Empresa
                </CardTitle>
                <CardDescription>
                    Esta información se usará para identificar tu empresa en el sistema
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-6">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Company Info */}
                    <div className="space-y-4">
                        <Input
                            label="Nombre de la Empresa *"
                            name="company_name"
                            placeholder="Mi Empresa de Servicio Técnico"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            error={state.errors?.company_name?.join(', ')}
                            required
                        />

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                URL de tu empresa *
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground-muted">techrepair.app/</span>
                                <input
                                    name="slug"
                                    type="text"
                                    value={slug}
                                    onChange={handleSlugChange}
                                    placeholder="mi-empresa"
                                    required
                                    className="flex-1 rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            {state.errors?.slug && (
                                <p className="mt-1.5 text-xs text-error">{state.errors.slug.join(', ')}</p>
                            )}
                            <p className="mt-1.5 text-xs text-foreground-muted">
                                Solo letras minúsculas, números y guiones
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-foreground-muted">Tu información</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-4">
                        <Input
                            label="Tu Nombre Completo *"
                            name="full_name"
                            placeholder="Juan Pérez"
                            defaultValue={defaultFullName}
                            error={state.errors?.full_name?.join(', ')}
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={defaultEmail}
                            disabled
                            hint="Este es el email con el que te registraste"
                        />

                        <Input
                            label="Teléfono"
                            name="phone"
                            placeholder="+593 999 999 999"
                            error={state.errors?.phone?.join(', ')}
                        />
                    </div>

                    {/* Plan Info */}
                    <div className="rounded-lg border border-border bg-background-secondary p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">Plan Starter - 14 días gratis</p>
                                <p className="text-sm text-foreground-secondary">
                                    Incluye hasta 3 usuarios, 50 clientes, órdenes de trabajo e informes técnicos.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button type="submit" className="w-full" loading={isPending}>
                        Crear Empresa y Continuar
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
