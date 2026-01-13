'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { addInvoiceLineAction, removeInvoiceLineAction } from '@/actions/invoices'
import { Plus, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InvoiceLine {
    id: string
    description: string
    quantity: number
    unit_price: number
    discount: number
    total: number
    product: {
        id: string
        name: string
    } | null
}

interface Product {
    id: string
    name: string
    unit_price: number
}

interface InvoiceLinesProps {
    invoiceId: string
    lines: InvoiceLine[]
    products: Product[]
    editable: boolean
}

export function InvoiceLines({ invoiceId, lines, products, editable }: InvoiceLinesProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Form state
    const [selectedProductId, setSelectedProductId] = useState('')
    const [description, setDescription] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [unitPrice, setUnitPrice] = useState('')
    const [discount, setDiscount] = useState('0')

    const handleProductSelect = (productId: string) => {
        setSelectedProductId(productId)
        const product = products.find(p => p.id === productId)
        if (product) {
            setDescription(product.name)
            setUnitPrice(String(product.unit_price))
        }
    }

    const handleAddLine = async () => {
        setIsAdding(true)
        const formData = new FormData()
        formData.set('product_id', selectedProductId || '')
        formData.set('description', description)
        formData.set('quantity', quantity)
        formData.set('unit_price', unitPrice)
        formData.set('discount', discount)

        const result = await addInvoiceLineAction(invoiceId, formData)

        if (!result.success) {
            alert(result.error || 'Error')
        } else {
            // Reset form
            setSelectedProductId('')
            setDescription('')
            setQuantity('1')
            setUnitPrice('')
            setDiscount('0')
            router.refresh()
        }
        setIsAdding(false)
    }

    const handleRemoveLine = async (lineId: string) => {
        setDeletingId(lineId)
        const result = await removeInvoiceLineAction(lineId, invoiceId)
        if (!result.success) {
            alert(result.error || 'Error')
        }
        router.refresh()
        setDeletingId(null)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Líneas de Factura
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Lines Table */}
                {lines.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-background-secondary">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Descripción</th>
                                    <th className="px-3 py-2 text-right font-medium text-foreground-secondary">Cant.</th>
                                    <th className="px-3 py-2 text-right font-medium text-foreground-secondary">Precio</th>
                                    <th className="px-3 py-2 text-right font-medium text-foreground-secondary">Total</th>
                                    {editable && <th className="px-3 py-2 w-10"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lines.map((line) => (
                                    <tr key={line.id}>
                                        <td className="px-3 py-2">{line.description}</td>
                                        <td className="px-3 py-2 text-right">{line.quantity}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(line.unit_price)}</td>
                                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.total)}</td>
                                        {editable && (
                                            <td className="px-3 py-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveLine(line.id)}
                                                    loading={deletingId === line.id}
                                                    className="text-error hover:bg-error/10 h-7 w-7 p-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {lines.length === 0 && (
                    <p className="text-sm text-foreground-muted text-center py-4">
                        No hay líneas. Agrega productos o servicios.
                    </p>
                )}

                {/* Add Line Form */}
                {editable && (
                    <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-medium mb-3">Agregar línea</h4>
                        <div className="grid gap-3 sm:grid-cols-5">
                            <div className="sm:col-span-2">
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                    className="w-full h-9 px-2 rounded border border-border bg-background-tertiary text-sm"
                                >
                                    <option value="">Producto (opcional)</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-3">
                                <Input
                                    placeholder="Descripción *"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    placeholder="Cant."
                                    min="0.01"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    placeholder="Precio"
                                    min="0"
                                    step="0.01"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    placeholder="Desc."
                                    min="0"
                                    step="0.01"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <Button
                                    onClick={handleAddLine}
                                    loading={isAdding}
                                    disabled={!description || !unitPrice}
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
