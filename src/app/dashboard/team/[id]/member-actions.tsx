'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { updateTeamMemberAction, removeTeamMemberAction } from '@/actions/team'
import { Settings, Trash2 } from 'lucide-react'

interface MemberActionsProps {
    memberId: string
    currentRole: string
    isActive: boolean
}

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Administrador' },
    { value: 'technician', label: 'Técnico' },
    { value: 'receptionist', label: 'Recepcionista' },
]

export function MemberActions({ memberId, currentRole, isActive }: MemberActionsProps) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [role, setRole] = useState(currentRole)
    const [active, setActive] = useState(isActive)

    const handleUpdate = async () => {
        setIsUpdating(true)
        const formData = new FormData()
        formData.set('role', role)
        formData.set('is_active', String(active))

        const result = await updateTeamMemberAction(memberId, {}, formData)

        if (result.success) {
            router.refresh()
        } else {
            alert(result.errors?._form?.join(', ') || 'Error')
        }
        setIsUpdating(false)
    }

    const handleRemove = async () => {
        if (!confirm('¿Estás seguro de eliminar este miembro del equipo?')) return

        setIsRemoving(true)
        const result = await removeTeamMemberAction(memberId)

        if (result.success) {
            router.push('/dashboard/team')
        } else {
            alert(result.error || 'Error')
        }
        setIsRemoving(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Administrar Usuario
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Rol
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_active" className="text-sm text-foreground">
                        Usuario activo
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={handleRemove}
                        loading={isRemoving}
                        className="text-error border-error hover:bg-error/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                    </Button>
                    <Button onClick={handleUpdate} loading={isUpdating}>
                        Guardar Cambios
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
