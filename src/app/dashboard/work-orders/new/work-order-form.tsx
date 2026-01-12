'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createWorkOrderAction, type WorkOrderFormState } from '@/actions/work-orders'
import { ClipboardList } from 'lucide-react'

interface Client {
    id: string
    company_name: string
}

interface User {
    id: string
    full_name: string
    role: string
}

interface WorkOrderFormProps {
    clients: Client[]
    technicians: User[]
    defaultClientId?: string
}

const initialState: WorkOrderFormState = {}

export function WorkOrderForm({ clients, technicians, defaultClientId }: WorkOrderFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createWorkOrderAction, initialState)

    useEffect(() => {
        if (state.success && state.orderId) {
            router.push(`/dashboard/work-orders/${state.orderId}`)
        }
    }, [state.success, state.orderId, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Nueva Orden de Trabajo
                </CardTitle>
                <CardDescription>
                    Registra un nuevo equipo para reparación o servicio
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-6">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Cliente */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Cliente *
                        </label>
                        <select
                            name="client_id"
                            defaultValue={defaultClientId || ''}
                            required
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.company_name}
                                </option>
                            ))}
                        </select>
                        {state.errors?.client_id && (
                            <p className="mt-1.5 text-xs text-error">{state.errors.client_id.join(', ')}</p>
                        )}
                    </div>

                    {/* Prioridad y Técnico */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Prioridad
                            </label>
                            <select
                                name="priority"
                                defaultValue="normal"
                                className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="low">Baja</option>
                                <option value="normal">Normal</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Asignar a Técnico
                            </label>
                            <select
                                name="assigned_to"
                                defaultValue=""
                                className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Sin asignar</option>
                                {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Información del Equipo */}
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-foreground mb-4">Información del Equipo</h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Tipo de Equipo"
                                name="device_type"
                                placeholder="Laptop, PC, Impresora..."
                                error={state.errors?.device_type?.join(', ')}
                            />

                            <Input
                                label="Marca"
                                name="device_brand"
                                placeholder="HP, Dell, Lenovo..."
                                error={state.errors?.device_brand?.join(', ')}
                            />

                            <Input
                                label="Modelo"
                                name="device_model"
                                placeholder="EliteBook 840 G7"
                                error={state.errors?.device_model?.join(', ')}
                            />

                            <Input
                                label="N° Serie"
                                name="device_serial"
                                placeholder="SN123456789"
                                error={state.errors?.device_serial?.join(', ')}
                            />
                        </div>
                    </div>

                    {/* Problema */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Descripción del Problema *
                        </label>
                        <textarea
                            name="problem_description"
                            rows={4}
                            placeholder="Describa el problema o síntoma que presenta el equipo..."
                            required
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                        {state.errors?.problem_description && (
                            <p className="mt-1.5 text-xs text-error">{state.errors.problem_description.join(', ')}</p>
                        )}
                    </div>

                    {/* Costo Estimado */}
                    <Input
                        label="Costo Estimado (USD)"
                        name="estimated_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        error={state.errors?.estimated_cost?.join(', ')}
                    />
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Crear Orden
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
