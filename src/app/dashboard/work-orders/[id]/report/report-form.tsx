'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createReportAction, type ReportFormState } from '@/actions/reports'
import { FileText, Smartphone } from 'lucide-react'

interface WorkOrder {
    id: string
    order_number: string
    device_type: string | null
    device_brand: string | null
    device_model: string | null
    problem_description: string
    client: {
        company_name: string
    }
}

interface ReportFormProps {
    workOrder: WorkOrder
}

const initialState: ReportFormState = {}

export function ReportForm({ workOrder }: ReportFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createReportAction, initialState)

    useEffect(() => {
        if (state.success) {
            router.push(`/dashboard/work-orders/${workOrder.id}`)
        }
    }, [state.success, workOrder.id, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Informe Técnico
                </CardTitle>
                <CardDescription>
                    Orden {workOrder.order_number} - {workOrder.client.company_name}
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <input type="hidden" name="work_order_id" value={workOrder.id} />

                <CardContent className="space-y-6">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Contexto del equipo */}
                    <div className="p-4 rounded-lg bg-background-secondary border border-border">
                        <div className="flex items-center gap-2 mb-3">
                            <Smartphone className="h-4 w-4 text-foreground-muted" />
                            <span className="text-sm font-medium text-foreground">Equipo</span>
                        </div>
                        <p className="text-sm text-foreground">
                            {[workOrder.device_brand, workOrder.device_model, workOrder.device_type].filter(Boolean).join(' - ') || 'No especificado'}
                        </p>
                        <p className="text-sm text-foreground-secondary mt-2">
                            <strong>Problema reportado:</strong> {workOrder.problem_description}
                        </p>
                    </div>

                    {/* Diagnóstico */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Diagnóstico *
                        </label>
                        <textarea
                            name="diagnosis"
                            rows={4}
                            placeholder="Describe el diagnóstico realizado al equipo..."
                            required
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        {state.errors?.diagnosis && (
                            <p className="mt-1.5 text-xs text-error">{state.errors.diagnosis.join(', ')}</p>
                        )}
                    </div>

                    {/* Trabajo Realizado */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Trabajo Realizado *
                        </label>
                        <textarea
                            name="work_performed"
                            rows={4}
                            placeholder="Describe el trabajo realizado para solucionar el problema..."
                            required
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        {state.errors?.work_performed && (
                            <p className="mt-1.5 text-xs text-error">{state.errors.work_performed.join(', ')}</p>
                        )}
                    </div>

                    {/* Repuestos Utilizados */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Repuestos Utilizados
                        </label>
                        <textarea
                            name="parts_used"
                            rows={3}
                            placeholder="Lista los repuestos usados (uno por línea)..."
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        <p className="mt-1.5 text-xs text-foreground-muted">
                            Ingresa un repuesto por línea
                        </p>
                    </div>

                    {/* Recomendaciones */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Recomendaciones
                        </label>
                        <textarea
                            name="recommendations"
                            rows={3}
                            placeholder="Recomendaciones para el cliente..."
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Guardar Informe
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
