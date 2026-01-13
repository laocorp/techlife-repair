'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { requestPlanUpgrade } from '@/actions/billing'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PlanSelectButtonProps {
    planId: string
    planName: string
    isCurrentPlan: boolean
}

export function PlanSelectButton({ planId, planName, isCurrentPlan }: PlanSelectButtonProps) {
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const router = useRouter()

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const result = await requestPlanUpgrade(planId, planName)

            if (result.success) {
                if (result.url) {
                    toast.loading('Redirigiendo a pasarela de pago...')
                    window.location.href = result.url
                    return
                }

                toast.success(result.message || 'Plan actualizado correctamente')
                setShowConfirm(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Error al cambiar el plan')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    if (isCurrentPlan) {
        return (
            <Button variant="outline" className="w-full" disabled>
                Plan Actual
            </Button>
        )
    }

    return (
        <>
            <Button className="w-full" onClick={() => setShowConfirm(true)}>
                Seleccionar Plan
            </Button>

            <Modal
                isOpen={showConfirm}
                onClose={() => !loading && setShowConfirm(false)}
                title={`Cambiar a plan ${planName}`}
                description="Se actualizará el plan de suscripción de tu organización."
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirm(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                'Confirmar cambio'
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm">
                        Estás a punto de actualizar tu plan a <strong>{planName}</strong>.
                    </p>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                        ℹ️ Serás redirigido a <strong>Payphone</strong> para completar el pago de forma segura.
                    </div>
                </div>
            </Modal>
        </>
    )
}
