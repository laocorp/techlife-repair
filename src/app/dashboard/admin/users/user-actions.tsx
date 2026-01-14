'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Shield, UserX, UserCheck } from 'lucide-react'
import { updateUserRoleAction, toggleUserStatusAction } from '@/actions/admin'

interface UserActionsProps {
    userId: string
    currentRole: string
    isActive: boolean
    isSuperAdmin: boolean
}

export function UserActions({ userId, currentRole, isActive, isSuperAdmin }: UserActionsProps) {
    const [loading, setLoading] = useState(false)

    if (isSuperAdmin) {
        return <span className="text-xs text-foreground-muted">Protegido</span>
    }

    const handleToggleStatus = async () => {
        const action = isActive ? 'desactivar' : 'activar'
        if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} este usuario?`)) return

        setLoading(true)
        const result = await toggleUserStatusAction(userId, !isActive)
        if (!result.success) alert(result.error)
        setLoading(false)
    }

    const handleChangeRole = async () => {
        const newRole = prompt(`Nuevo rol (admin, technician, user):`, currentRole)
        if (!newRole || !['admin', 'technician', 'user'].includes(newRole)) return

        setLoading(true)
        const result = await updateUserRoleAction(userId, newRole as 'admin' | 'technician' | 'user')
        if (!result.success) alert(result.error)
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleToggleStatus}
                disabled={loading}
                title={isActive ? 'Desactivar' : 'Activar'}
            >
                {isActive ? <UserX className="h-4 w-4 text-error" /> : <UserCheck className="h-4 w-4 text-success" />}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleChangeRole}
                disabled={loading}
                title="Cambiar rol"
            >
                <Shield className="h-4 w-4" />
            </Button>
        </div>
    )
}
