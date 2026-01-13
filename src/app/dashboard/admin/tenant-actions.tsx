'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import { MoreHorizontal, Play, Pause, Calendar, Trash2, CreditCard } from 'lucide-react'
import {
    updateTenantStatusAction,
    updateSubscriptionStatusAction,
    extendTrialAction,
    deleteTenantAction
} from '@/actions/admin'

interface TenantActionsProps {
    tenantId: string
    currentStatus: string
    subscriptionStatus: string | null
}

export function TenantActions({ tenantId, currentStatus, subscriptionStatus }: TenantActionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSuspend = async () => {
        if (!confirm('¿Suspender esta empresa? Sus usuarios no podrán acceder.')) return
        setLoading(true)
        const result = await updateTenantStatusAction(tenantId, 'suspended')
        if (!result.success) alert(result.error)
        setLoading(false)
        setIsOpen(false)
    }

    const handleActivate = async () => {
        setLoading(true)
        const result = await updateTenantStatusAction(tenantId, 'active')
        if (!result.success) alert(result.error)
        setLoading(false)
        setIsOpen(false)
    }

    const handleActivateSubscription = async () => {
        setLoading(true)
        const result = await updateSubscriptionStatusAction(tenantId, 'active')
        if (!result.success) alert(result.error)
        setLoading(false)
        setIsOpen(false)
    }

    const handleExtendTrial = async () => {
        const days = prompt('¿Cuántos días extender el trial?', '7')
        if (!days) return
        setLoading(true)
        const result = await extendTrialAction(tenantId, parseInt(days, 10))
        if (!result.success) alert(result.error)
        setLoading(false)
        setIsOpen(false)
    }

    const handleDelete = async () => {
        if (!confirm('¿ELIMINAR esta empresa permanentemente? Esta acción no se puede deshacer.')) return
        if (!confirm('¿Estás 100% seguro?')) return
        setLoading(true)
        const result = await deleteTenantAction(tenantId)
        if (!result.success) alert(result.error)
        setLoading(false)
        setIsOpen(false)
    }

    return (
        <div className="relative inline-block">
            <Button
                ref={buttonRef}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                disabled={loading}
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 bottom-full mb-2 w-52 py-1 bg-background border border-border rounded-lg shadow-xl"
                    style={{ zIndex: 9999 }}
                >
                    {currentStatus === 'active' ? (
                        <button
                            onClick={handleSuspend}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-background-secondary text-error transition-colors"
                        >
                            <Pause className="h-4 w-4" />
                            Suspender empresa
                        </button>
                    ) : (
                        <button
                            onClick={handleActivate}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-background-secondary text-success transition-colors"
                        >
                            <Play className="h-4 w-4" />
                            Activar empresa
                        </button>
                    )}

                    {subscriptionStatus !== 'active' && (
                        <button
                            onClick={handleActivateSubscription}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-background-secondary transition-colors"
                        >
                            <CreditCard className="h-4 w-4" />
                            Marcar como pagado
                        </button>
                    )}

                    <button
                        onClick={handleExtendTrial}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-background-secondary transition-colors"
                    >
                        <Calendar className="h-4 w-4" />
                        Extender trial
                    </button>

                    <hr className="my-1 border-border" />

                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-error/10 text-error transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar empresa
                    </button>
                </div>
            )}
        </div>
    )
}
