'use client'

import { useActionState, useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { updateProfileAction, changePasswordAction, type ProfileFormState } from '@/actions/settings'
import { User, Lock, Check } from 'lucide-react'

interface UserData {
    id: string
    full_name: string
    email: string
    phone: string | null
}

interface SecurityFormProps {
    user: UserData
    authEmail: string
}

const initialProfileState: ProfileFormState = {}
const initialPasswordState: { success?: boolean; error?: string } = {}

export function SecurityForm({ user, authEmail }: SecurityFormProps) {
    const [profileState, profileAction, isProfilePending] = useActionState(updateProfileAction, initialProfileState)
    const [passwordState, passwordAction, isPasswordPending] = useActionState(changePasswordAction, initialPasswordState)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Mi Perfil
                    </CardTitle>
                </CardHeader>

                <form action={profileAction}>
                    <CardContent className="space-y-4">
                        {profileState.errors?._form && (
                            <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                                {profileState.errors._form.join(', ')}
                            </div>
                        )}

                        {profileState.success && (
                            <div className="rounded-md bg-success/10 border border-success/20 p-3 text-sm text-success flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                {profileState.message}
                            </div>
                        )}

                        <Input
                            label="Nombre Completo *"
                            name="full_name"
                            defaultValue={user.full_name}
                            required
                            error={profileState.errors?.full_name?.join(', ')}
                        />

                        <Input
                            label="Email"
                            value={authEmail}
                            disabled
                            className="bg-background-secondary"
                        />

                        <Input
                            label="Teléfono"
                            name="phone"
                            type="tel"
                            defaultValue={user.phone || ''}
                            placeholder="+593 99 123 4567"
                        />
                    </CardContent>

                    <CardFooter className="flex justify-end">
                        <Button type="submit" loading={isProfilePending}>
                            Guardar Perfil
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Contraseña
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {!showPasswordForm ? (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-foreground-secondary">
                                Cambia tu contraseña de acceso
                            </p>
                            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                                Cambiar Contraseña
                            </Button>
                        </div>
                    ) : (
                        <form action={passwordAction} className="space-y-4">
                            {passwordState.error && (
                                <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                                    {passwordState.error}
                                </div>
                            )}

                            {passwordState.success && (
                                <div className="rounded-md bg-success/10 border border-success/20 p-3 text-sm text-success flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Contraseña actualizada exitosamente
                                </div>
                            )}

                            <Input
                                label="Nueva Contraseña"
                                name="new_password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />

                            <Input
                                label="Confirmar Contraseña"
                                name="confirm_password"
                                type="password"
                                placeholder="Repetir contraseña"
                                required
                            />

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" loading={isPasswordPending}>
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
