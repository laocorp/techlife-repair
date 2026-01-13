'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { adjustStockAction } from '@/actions/inventory'
import { Plus, Minus, Package } from 'lucide-react'

interface StockActionsProps {
    productId: string
    currentStock: number
}

export function StockActions({ productId, currentStock }: StockActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')

    const handleAdjust = async (type: 'add' | 'subtract') => {
        if (quantity <= 0) return

        setIsLoading(true)
        const result = await adjustStockAction(productId, quantity, type, notes || undefined)

        if (!result.success) {
            alert(result.error || 'Error al ajustar stock')
        } else {
            setQuantity(1)
            setNotes('')
            router.refresh()
        }
        setIsLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ajustar Stock
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            label="Cantidad"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            label="Notas (opcional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Compra, ajuste..."
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAdjust('add')}
                        loading={isLoading}
                        className="flex-1"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAdjust('subtract')}
                        loading={isLoading}
                        disabled={currentStock < quantity}
                        className="flex-1"
                    >
                        <Minus className="h-4 w-4" />
                        Restar
                    </Button>
                </div>

                <p className="text-xs text-foreground-muted text-center">
                    Stock actual: {currentStock} unidades
                </p>
            </CardContent>
        </Card>
    )
}
