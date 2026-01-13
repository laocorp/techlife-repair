'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { inviteTeamMemberAction, type TeamFormState } from '@/actions/team'
import { UserPlus } from 'lucide-react'

const initialState: TeamFormState = {}

export function InviteForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(inviteTeamMemberAction, initialState)

    useEffect(() => {
        if (state.success) {
            router.push('/dashboard/team')
        }
    }, [state.success, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Invitar Miembro
                </CardTitle>
                <CardDescription>
                    Agrega un nuevo miembro a tu equipo
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    <Input
                        label="Nombre completo *"
                        name="full_name"
                        placeholder="Juan Pérez"
                        required
                        error={state.errors?.full_name?.join(', ')}
                    />

                    <Input
                        label="Email *"
                        name="email"
                        type="email"
                        placeholder="juan@empresa.com"
                        required
                        error={state.errors?.email?.join(', ')}
                    />

                    <Input
                        label="Teléfono"
                        name="phone"
                        type="tel"
                        placeholder="+593 99 123 4567"
                        error={state.errors?.phone?.join(', ')}
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Rol *
                        </label>
                        <select
                            name="role"
                            required
                            defaultValue="technician"
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="admin">Administrador</option>
                            <option value="technician">Técnico</option>
                            <option value="receptionist">Recepcionista</option>
                        </select>
                        <p className="mt-1.5 text-xs text-foreground-muted">
                            Los administradores pueden gestionar todo. Los técnicos trabajan en órdenes. Los recepcionistas atienden clientes.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Enviar Invitación
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
