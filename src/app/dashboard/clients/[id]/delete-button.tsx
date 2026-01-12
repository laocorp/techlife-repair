'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Trash2 } from 'lucide-react'
import { deleteClientAction } from '@/actions/clients'

interface DeleteClientButtonProps {
    id: string
    name: string
}

export function DeleteClientButton({ id, name }: DeleteClientButtonProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteClientAction(id)

        if (result.success) {
            router.push('/dashboard/clients')
        } else {
            alert(result.error || 'Error al eliminar cliente')
            setIsDeleting(false)
            setShowConfirm(false)
        }
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-secondary">¿Eliminar?</span>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    loading={isDeleting}
                >
                    Sí
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                >
                    No
                </Button>
            </div>
        )
    }

    return (
        <Button variant="outline" onClick={() => setShowConfirm(true)}>
            <Trash2 className="h-4 w-4 text-error" />
        </Button>
    )
}
