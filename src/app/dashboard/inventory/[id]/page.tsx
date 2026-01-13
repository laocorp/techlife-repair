import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Pencil, Package, DollarSign, Layers, BarChart3 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { StockActions } from './stock-actions'

interface ProductDetailPageProps {
    params: Promise<{ id: string }>
}

interface Product {
    id: string
    name: string
    sku: string | null
    description: string | null
    unit_price: number
    cost_price: number
    stock_quantity: number
    min_stock_level: number
    is_service: boolean
    is_active: boolean
    created_at: string
    category: {
        id: string
        name: string
    } | null
}

async function getProduct(
    supabase: Awaited<ReturnType<typeof createClient>>,
    id: string
): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      category:product_categories(id, name)
    `)
        .eq('id', id)
        .single()

    if (error) return null

    return {
        ...data,
        category: data.category as unknown as { id: string; name: string } | null,
    }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const product = await getProduct(supabase, id)

    if (!product) {
        notFound()
    }

    const isLowStock = !product.is_service && product.stock_quantity <= product.min_stock_level
    const margin = product.cost_price > 0
        ? ((product.unit_price - product.cost_price) / product.cost_price * 100).toFixed(1)
        : null

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/inventory"
                className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al Inventario
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-foreground">
                            {product.name}
                        </h1>
                        {product.is_service && <Badge variant="info">Servicio</Badge>}
                        {!product.is_active && <Badge variant="default">Inactivo</Badge>}
                    </div>
                    {product.sku && (
                        <p className="text-foreground-secondary mt-1">SKU: {product.sku}</p>
                    )}
                </div>
                <Link href={`/dashboard/inventory/${id}/edit`}>
                    <Button variant="outline">
                        <Pencil className="h-4 w-4" />
                        Editar
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(product.unit_price)}</p>
                                <p className="text-sm text-foreground-secondary">Precio venta</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!product.is_service && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isLowStock ? 'bg-error/10' : 'bg-success/10'}`}>
                                    <Package className={`h-5 w-5 ${isLowStock ? 'text-error' : 'text-success'}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{product.stock_quantity}</p>
                                    <p className="text-sm text-foreground-secondary">En stock</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {margin && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">{margin}%</p>
                                    <p className="text-sm text-foreground-secondary">Margen</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Low Stock Alert */}
            {isLowStock && (
                <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                    <p className="text-sm text-foreground">
                        ⚠️ Stock bajo. Mínimo recomendado: {product.min_stock_level} unidades.
                    </p>
                </div>
            )}

            {/* Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {product.description && (
                        <div>
                            <p className="text-xs text-foreground-muted mb-1">Descripción</p>
                            <p className="text-sm text-foreground">{product.description}</p>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-foreground-muted mb-1">Categoría</p>
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-foreground-muted" />
                                <span className="text-sm text-foreground">
                                    {product.category?.name || 'Sin categoría'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-foreground-muted mb-1">Precio de Costo</p>
                            <p className="text-sm text-foreground">
                                {product.cost_price > 0 ? formatCurrency(product.cost_price) : '-'}
                            </p>
                        </div>
                        {!product.is_service && (
                            <div>
                                <p className="text-xs text-foreground-muted mb-1">Stock Mínimo</p>
                                <p className="text-sm text-foreground">{product.min_stock_level} unidades</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-foreground-muted mb-1">Creado</p>
                            <p className="text-sm text-foreground">{formatDate(product.created_at)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stock Actions */}
            {!product.is_service && (
                <StockActions productId={product.id} currentStock={product.stock_quantity} />
            )}
        </div>
    )
}
