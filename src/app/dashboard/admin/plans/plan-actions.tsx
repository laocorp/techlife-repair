'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { deletePlanAction } from '@/actions/admin'
import Link from 'next/link'

interface PlanActionsProps {
    planId: string
    isActive: boolean
    hasTenants: boolean
}

export function PlanActions({ planId, isActive, hasTenants }: PlanActionsProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (hasTenants) {
            alert('No puedes eliminar un plan que tiene empresas asignadas')
            return
        }

        if (!confirm('¿Eliminar este plan permanentemente?')) return

        setLoading(true)
        const result = await deletePlanAction(planId)
        if (!result.success) alert(result.error)
        setLoading(false)
    }

    return (
        <div className="flex items-center gap-1">
            <Link href={`/dashboard/admin/plans/${planId}/edit`}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Editar"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </Link>
            {!hasTenants && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleDelete}
                    disabled={loading}
                    title="Eliminar"
                >
                    <Trash2 className="h-4 w-4 text-error" />
                </Button>
            )}
        </div>
    )
}
