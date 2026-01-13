import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent } from '@/components/ui'
import { Plus, Package, AlertTriangle, Layers, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { hasModuleAccess } from '@/lib/plans'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Inventario',
}

interface Product {
    id: string
    name: string
    sku: string | null
    unit_price: number
    stock_quantity: number
    min_stock_level: number
    is_service: boolean
    is_active: boolean
    category: {
        id: string
        name: string
    } | null
}

interface Category {
    id: string
    name: string
    _count: number
}

async function getProducts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select(`
      id, name, sku, unit_price, stock_quantity, min_stock_level, is_service, is_active,
      category:product_categories(id, name)
    `)
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    return (data || []).map(p => ({
        ...p,
        category: p.category as unknown as { id: string; name: string } | null,
    }))
}

async function getCategories(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Category[]> {
    const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name')

    if (error) return []

    // Get product counts per category
    const { data: products } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true)

    const counts: Record<string, number> = {}
    products?.forEach(p => {
        if (p.category_id) {
            counts[p.category_id] = (counts[p.category_id] || 0) + 1
        }
    })

    return (data || []).map(c => ({
        ...c,
        _count: counts[c.id] || 0,
    }))
}

export default async function InventoryPage() {
    if (!await hasModuleAccess('inventory')) {
        redirect('/dashboard')
    }
    const supabase = await createClient()
    const [products, categories] = await Promise.all([
        getProducts(supabase),
        getCategories(supabase),
    ])

    const lowStockProducts = products.filter(p => !p.is_service && p.stock_quantity <= p.min_stock_level)
    const totalValue = products.reduce((sum, p) => sum + (p.unit_price * p.stock_quantity), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Inventario</h1>
                    <p className="text-foreground-secondary">
                        Gestiona productos y stock
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/inventory/categories">
                        <Button variant="outline">
                            <Layers className="h-4 w-4" />
                            Categorías
                        </Button>
                    </Link>
                    <Link href="/dashboard/inventory/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Nuevo Producto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{products.length}</p>
                                <p className="text-sm text-foreground-secondary">Productos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{categories.length}</p>
                                <p className="text-sm text-foreground-secondary">Categorías</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{lowStockProducts.length}</p>
                                <p className="text-sm text-foreground-secondary">Stock bajo</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                                <p className="text-sm text-foreground-secondary">Valor total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="font-medium text-foreground">Alerta de Stock Bajo</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                        {lowStockProducts.length} producto(s) con stock bajo o agotado
                    </p>
                </div>
            )}

            {/* Products Table */}
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <Package className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">
                        No hay productos
                    </h3>
                    <p className="text-foreground-secondary text-center mb-4">
                        Agrega tu primer producto al inventario
                    </p>
                    <Link href="/dashboard/inventory/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Nuevo Producto
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-background-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                                    Producto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                                    SKU
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                                    Categoría
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-secondary uppercase">
                                    Precio
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-secondary uppercase">
                                    Stock
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((product) => {
                                const isLowStock = !product.is_service && product.stock_quantity <= product.min_stock_level
                                return (
                                    <tr key={product.id} className="hover:bg-background-secondary/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <Link
                                                href={`/dashboard/inventory/${product.id}`}
                                                className="font-medium text-foreground hover:text-primary transition-colors"
                                            >
                                                {product.name}
                                            </Link>
                                            {product.is_service && (
                                                <Badge variant="info" className="ml-2">Servicio</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground-secondary">
                                            {product.sku || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground-secondary">
                                            {product.category?.name || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground text-right">
                                            {formatCurrency(product.unit_price)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {product.is_service ? (
                                                <span className="text-sm text-foreground-muted">N/A</span>
                                            ) : (
                                                <Badge variant={isLowStock ? 'error' : 'success'}>
                                                    {product.stock_quantity}
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
