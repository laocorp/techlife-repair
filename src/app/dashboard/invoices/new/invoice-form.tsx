'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createInvoiceAction, type InvoiceFormState } from '@/actions/invoices'
import { FileText } from 'lucide-react'

interface Client {
    id: string
    company_name: string
}

interface WorkOrder {
    id: string
    order_number: string
    client_id: string
    final_cost: number | null
}

interface InvoiceFormProps {
    clients: Client[]
    workOrders: WorkOrder[]
    defaultWorkOrderId?: string
    defaultClientId?: string
}

const initialState: InvoiceFormState = {}

export function InvoiceForm({ clients, workOrders, defaultWorkOrderId, defaultClientId }: InvoiceFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState)

    const defaultWO = workOrders.find(wo => wo.id === defaultWorkOrderId)
    const [selectedClientId, setSelectedClientId] = useState(defaultWO?.client_id || defaultClientId || '')
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(defaultWorkOrderId || '')

    useEffect(() => {
        if (state.success && state.invoiceId) {
            router.push(`/dashboard/invoices/${state.invoiceId}`)
        }
    }, [state.success, state.invoiceId, router])

    // Filter work orders by selected client
    const filteredWorkOrders = selectedClientId
        ? workOrders.filter(wo => wo.client_id === selectedClientId)
        : workOrders

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Nueva Factura
                </CardTitle>
                <CardDescription>
                    Crea una nueva factura para un cliente
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
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
                            value={selectedClientId}
                            onChange={(e) => {
                                setSelectedClientId(e.target.value)
                                setSelectedWorkOrderId('')
                            }}
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
                    </div>

                    {/* Orden de trabajo */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Orden de Trabajo (opcional)
                        </label>
                        <select
                            name="work_order_id"
                            value={selectedWorkOrderId}
                            onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Sin orden de trabajo</option>
                            {filteredWorkOrders.map((wo) => (
                                <option key={wo.id} value={wo.id}>
                                    {wo.order_number} {wo.final_cost ? `- $${wo.final_cost}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Fecha de vencimiento"
                            name="due_date"
                            type="date"
                        />
                        <Input
                            label="IVA (%)"
                            name="tax_rate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue="12"
                        />
                    </div>

                    <Input
                        label="Descuento global ($)"
                        name="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue="0"
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Notas
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            placeholder="Notas adicionales..."
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Crear Factura
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
