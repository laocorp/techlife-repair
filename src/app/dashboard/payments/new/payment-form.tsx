'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createPaymentAction, type PaymentFormState } from '@/actions/payments'
import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Invoice {
    id: string
    invoice_number: string
    total: number
    total_paid: number
    client: {
        company_name: string
    }
}

interface PaymentFormProps {
    invoices: Invoice[]
    defaultInvoiceId?: string
}

const initialState: PaymentFormState = {}

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'check', label: 'Cheque' },
    { value: 'other', label: 'Otro' },
]

export function PaymentForm({ invoices, defaultInvoiceId }: PaymentFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createPaymentAction, initialState)
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(defaultInvoiceId || '')

    const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId)
    const pendingAmount = selectedInvoice ? selectedInvoice.total - selectedInvoice.total_paid : 0

    useEffect(() => {
        if (state.success) {
            router.push('/dashboard/payments')
        }
    }, [state.success, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Registrar Pago
                </CardTitle>
                <CardDescription>
                    Registra un pago recibido
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Factura */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Factura *
                        </label>
                        <select
                            name="invoice_id"
                            value={selectedInvoiceId}
                            onChange={(e) => setSelectedInvoiceId(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Seleccionar factura...</option>
                            {invoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoice_number} - {inv.client.company_name} (Pendiente: {formatCurrency(inv.total - inv.total_paid)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedInvoice && (
                        <div className="p-3 rounded-lg bg-background-secondary border border-border">
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground-secondary">Total factura:</span>
                                <span className="font-medium">{formatCurrency(selectedInvoice.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-foreground-secondary">Ya pagado:</span>
                                <span>{formatCurrency(selectedInvoice.total_paid)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1 pt-1 border-t border-border">
                                <span className="text-foreground-secondary">Pendiente:</span>
                                <span className="font-semibold text-primary">{formatCurrency(pendingAmount)}</span>
                            </div>
                        </div>
                    )}

                    <Input
                        label="Monto *"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={pendingAmount || undefined}
                        placeholder="0.00"
                        required
                        error={state.errors?.amount?.join(', ')}
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Método de Pago *
                        </label>
                        <select
                            name="payment_method"
                            required
                            defaultValue="cash"
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {PAYMENT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Fecha"
                            name="payment_date"
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                        />
                        <Input
                            label="Referencia"
                            name="reference"
                            placeholder="# transacción"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Notas
                        </label>
                        <textarea
                            name="notes"
                            rows={2}
                            placeholder="Notas adicionales..."
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending} disabled={!selectedInvoiceId}>
                        Registrar Pago
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
