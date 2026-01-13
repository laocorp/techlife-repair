'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createAccountingEntryAction, INCOME_CATEGORIES, EXPENSE_CATEGORIES, type AccountingFormState } from '@/actions/accounting'
import { DollarSign } from 'lucide-react'

const initialState: AccountingFormState = {}

export function EntryForm() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createAccountingEntryAction, initialState)
    const [type, setType] = useState<'income' | 'expense'>('income')

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

    useEffect(() => {
        if (state.success) {
            router.push('/dashboard/accounting')
        }
    }, [state.success, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Nuevo Movimiento
                </CardTitle>
                <CardDescription>
                    Registra un ingreso o gasto
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Tipo */}
                    <div className="flex gap-4">
                        <label className="flex-1">
                            <input
                                type="radio"
                                name="type"
                                value="income"
                                checked={type === 'income'}
                                onChange={() => setType('income')}
                                className="sr-only peer"
                            />
                            <div className="p-4 rounded-lg border-2 cursor-pointer transition-all peer-checked:border-success peer-checked:bg-success/5 border-border hover:border-success/50">
                                <div className="text-center">
                                    <span className="text-2xl">📈</span>
                                    <p className="font-medium mt-1">Ingreso</p>
                                </div>
                            </div>
                        </label>
                        <label className="flex-1">
                            <input
                                type="radio"
                                name="type"
                                value="expense"
                                checked={type === 'expense'}
                                onChange={() => setType('expense')}
                                className="sr-only peer"
                            />
                            <div className="p-4 rounded-lg border-2 cursor-pointer transition-all peer-checked:border-error peer-checked:bg-error/5 border-border hover:border-error/50">
                                <div className="text-center">
                                    <span className="text-2xl">📉</span>
                                    <p className="font-medium mt-1">Gasto</p>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Categoría *
                        </label>
                        <select
                            name="category"
                            required
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Seleccionar...</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Monto *"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        required
                        error={state.errors?.amount?.join(', ')}
                    />

                    <Input
                        label="Descripción *"
                        name="description"
                        placeholder="Ej: Pago de alquiler mensual"
                        required
                        error={state.errors?.description?.join(', ')}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Fecha *"
                            name="entry_date"
                            type="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                        />
                        <Input
                            label="Referencia"
                            name="reference"
                            placeholder="# factura, recibo..."
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Guardar
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
