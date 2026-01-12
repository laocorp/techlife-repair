'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { updateClientAction, type ClientFormState } from '@/actions/clients'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import type { Client } from '@/types/database'

interface EditClientFormProps {
    client: Client
}

export function EditClientForm({ client }: EditClientFormProps) {
    const router = useRouter()
    const updateClientWithId = updateClientAction.bind(null, client.id)
    const initialState: ClientFormState = {}
    const [state, formAction, isPending] = useActionState(updateClientWithId, initialState)

    useEffect(() => {
        if (state.success) {
            router.push(`/dashboard/clients/${client.id}`)
        }
    }, [state.success, router, client.id])

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Cliente
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Editar Cliente</CardTitle>
                </CardHeader>

                <form action={formAction}>
                    <CardContent className="space-y-4">
                        {state.errors?._form && (
                            <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                                {state.errors._form.join(', ')}
                            </div>
                        )}

                        <Input
                            label="Nombre de la Empresa *"
                            name="company_name"
                            placeholder="Empresa XYZ S.A."
                            defaultValue={client.company_name}
                            error={state.errors?.company_name?.join(', ')}
                            required
                        />

                        <Input
                            label="RUC / Cédula"
                            name="tax_id"
                            placeholder="1234567890001"
                            defaultValue={client.tax_id || ''}
                            error={state.errors?.tax_id?.join(', ')}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="contacto@empresa.com"
                                defaultValue={client.email || ''}
                                error={state.errors?.email?.join(', ')}
                            />

                            <Input
                                label="Teléfono"
                                name="phone"
                                placeholder="+593 999 999 999"
                                defaultValue={client.phone || ''}
                                error={state.errors?.phone?.join(', ')}
                            />
                        </div>

                        <Input
                            label="Dirección"
                            name="address"
                            placeholder="Av. Principal 123, Ciudad"
                            defaultValue={client.address || ''}
                            error={state.errors?.address?.join(', ')}
                        />

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Notas
                            </label>
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder="Información adicional del cliente..."
                                defaultValue={client.notes || ''}
                                className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-3">
                        <Link href={`/dashboard/clients/${client.id}`}>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" loading={isPending}>
                            Guardar Cambios
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
