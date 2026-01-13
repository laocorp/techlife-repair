'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { updateInvoiceStatusAction, deleteInvoiceAction } from '@/actions/invoices'
import { Send, CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface InvoiceStatusActionsProps {
    invoiceId: string
    currentStatus: string
}

const STATUS_FLOW: Record<string, Array<{
    status: string
    label: string
    icon: typeof Send
    variant: 'primary' | 'outline'
}>> = {
    draft: [
        { status: 'sent', label: 'Enviar', icon: Send, variant: 'primary' },
    ],
    sent: [
        { status: 'paid', label: 'Marcar Pagada', icon: CheckCircle, variant: 'primary' },
        { status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'outline' },
    ],
    partial: [
        { status: 'paid', label: 'Marcar Pagada', icon: CheckCircle, variant: 'primary' },
    ],
    overdue: [
        { status: 'paid', label: 'Marcar Pagada', icon: CheckCircle, variant: 'primary' },
        { status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'outline' },
    ],
    paid: [],
    cancelled: [],
}

export function InvoiceStatusActions({ invoiceId, currentStatus }: InvoiceStatusActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const actions = STATUS_FLOW[currentStatus] || []

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(newStatus)
        const result = await updateInvoiceStatusAction(invoiceId, newStatus)

        if (!result.success) {
            alert(result.error || 'Error')
        }

        setIsLoading(null)
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm('¿Eliminar esta factura?')) return

        setIsDeleting(true)
        const result = await deleteInvoiceAction(invoiceId)

        if (result.success) {
            router.push('/dashboard/invoices')
        } else {
            alert(result.error || 'Error')
            setIsDeleting(false)
        }
    }

    if (actions.length === 0 && currentStatus !== 'draft') {
        return null
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

            {currentStatus === 'draft' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    loading={isDeleting}
                    className="text-error border-error hover:bg-error/10 ml-auto"
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </Button>
            )}
        </div>
    )
}
