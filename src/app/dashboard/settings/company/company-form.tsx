'use client'

import { useActionState } from 'react'
import { useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { updateCompanyAction, type CompanyFormState } from '@/actions/settings'
import { Building2, Check } from 'lucide-react'

interface Tenant {
    id: string
    name: string
    slug: string
    tax_id: string | null
    phone: string | null
    address: string | null
    email: string | null
}

interface CompanyFormProps {
    tenant: Tenant
}

const initialState: CompanyFormState = {}

export function CompanyForm({ tenant }: CompanyFormProps) {
    const [state, formAction, isPending] = useActionState(updateCompanyAction, initialState)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Datos de la Empresa
                </CardTitle>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {state.success && (
                        <div className="rounded-md bg-success/10 border border-success/20 p-3 text-sm text-success flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            {state.message}
                        </div>
                    )}

                    <Input
                        label="Nombre de la Empresa *"
                        name="name"
                        defaultValue={tenant.name}
                        required
                        error={state.errors?.name?.join(', ')}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="RUC / NIT"
                            name="tax_id"
                            defaultValue={tenant.tax_id || ''}
                            placeholder="1234567890001"
                        />
                        <Input
                            label="Teléfono"
                            name="phone"
                            type="tel"
                            defaultValue={tenant.phone || ''}
                            placeholder="+593 99 123 4567"
                        />
                    </div>

                    <Input
                        label="Email de Contacto"
                        name="email"
                        type="email"
                        defaultValue={tenant.email || ''}
                        placeholder="info@empresa.com"
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Dirección
                        </label>
                        <textarea
                            name="address"
                            rows={2}
                            defaultValue={tenant.address || ''}
                            placeholder="Av. Principal 123, Ciudad"
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="rounded-lg bg-background-secondary p-3">
                        <p className="text-xs text-foreground-muted">
                            <strong>Slug:</strong> {tenant.slug}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end">
                    <Button type="submit" loading={isPending}>
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
