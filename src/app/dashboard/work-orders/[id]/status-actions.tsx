'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { updateWorkOrderStatus } from '@/actions/work-orders'
import { Play, CheckCircle, Package, XCircle } from 'lucide-react'

interface StatusActionsProps {
    orderId: string
    currentStatus: string
}

const STATUS_FLOW = {
    open: [
        { status: 'in_progress', label: 'Iniciar Trabajo', icon: Play, variant: 'primary' as const },
        { status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'outline' as const },
    ],
    in_progress: [
        { status: 'waiting_parts', label: 'Esperando Repuestos', icon: Package, variant: 'outline' as const },
        { status: 'completed', label: 'Marcar Completado', icon: CheckCircle, variant: 'primary' as const },
        { status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'outline' as const },
    ],
    waiting_parts: [
        { status: 'in_progress', label: 'Continuar Trabajo', icon: Play, variant: 'primary' as const },
        { status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'outline' as const },
    ],
    completed: [
        { status: 'delivered', label: 'Marcar Entregado', icon: Package, variant: 'primary' as const },
    ],
    delivered: [],
    cancelled: [],
}

export function StatusActions({ orderId, currentStatus }: StatusActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const actions = STATUS_FLOW[currentStatus as keyof typeof STATUS_FLOW] || []

    if (actions.length === 0) {
        return null
    }

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(newStatus)
        const result = await updateWorkOrderStatus(orderId, newStatus)

        if (!result.success) {
            alert(result.error || 'Error al cambiar estado')
        }

        setIsLoading(null)
        router.refresh()
    }

    return (
        <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-border bg-background-secondary">
            <span className="text-sm text-foreground-secondary mr-2 self-center">Acciones:</span>
            {actions.map(({ status, label, icon: Icon, variant }) => (
                <Button
                    key={status}
                    variant={variant === 'primary' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    loading={isLoading === status}
                    disabled={isLoading !== null}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Button>
            ))}
        </div>
    )
}
