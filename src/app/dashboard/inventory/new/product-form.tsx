'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { createProductAction, type ProductFormState } from '@/actions/inventory'
import { Package } from 'lucide-react'

interface Category {
    id: string
    name: string
}

interface ProductFormProps {
    categories: Category[]
}

const initialState: ProductFormState = {}

export function ProductForm({ categories }: ProductFormProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createProductAction, initialState)
    const [isService, setIsService] = useState(false)

    useEffect(() => {
        if (state.success && state.productId) {
            router.push(`/dashboard/inventory/${state.productId}`)
        }
    }, [state.success, state.productId, router])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Nuevo Producto
                </CardTitle>
                <CardDescription>
                    Agrega un producto o servicio al inventario
                </CardDescription>
            </CardHeader>

            <form action={formAction}>
                <input type="hidden" name="is_service" value={String(isService)} />

                <CardContent className="space-y-4">
                    {state.errors?._form && (
                        <div className="rounded-md bg-error-light border border-error/20 p-3 text-sm text-error">
                            {state.errors._form.join(', ')}
                        </div>
                    )}

                    {/* Tipo */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="product_type"
                                checked={!isService}
                                onChange={() => setIsService(false)}
                                className="h-4 w-4 text-primary"
                            />
                            <span className="text-sm">Producto físico</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="product_type"
                                checked={isService}
                                onChange={() => setIsService(true)}
                                className="h-4 w-4 text-primary"
                            />
                            <span className="text-sm">Servicio</span>
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre *"
                            name="name"
                            placeholder="Memoria RAM DDR4 8GB"
                            required
                            error={state.errors?.name?.join(', ')}
                        />

                        <Input
                            label="SKU"
                            name="sku"
                            placeholder="RAM-DDR4-8GB"
                            error={state.errors?.sku?.join(', ')}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Categoría
                        </label>
                        <select
                            name="category_id"
                            className="w-full h-10 px-3 rounded-[var(--radius)] border border-border bg-background-tertiary text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Descripción del producto..."
                            className="w-full rounded-[var(--radius)] border border-border bg-background-tertiary px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Precio de Venta *"
                            name="unit_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            required
                            error={state.errors?.unit_price?.join(', ')}
                        />

                        <Input
                            label="Precio de Costo"
                            name="cost_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            error={state.errors?.cost_price?.join(', ')}
                        />
                    </div>

                    {!isService && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Stock Inicial"
                                name="stock_quantity"
                                type="number"
                                min="0"
                                defaultValue="0"
                                error={state.errors?.stock_quantity?.join(', ')}
                            />

                            <Input
                                label="Stock Mínimo"
                                name="min_stock_level"
                                type="number"
                                min="0"
                                defaultValue="5"
                                error={state.errors?.min_stock_level?.join(', ')}
                            />
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Crear Producto
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
