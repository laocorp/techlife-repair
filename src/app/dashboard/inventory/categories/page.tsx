import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { CategoriesClient } from './categories-client'

export const metadata = {
    title: 'Categorías',
}

interface Category {
    id: string
    name: string
    description: string | null
    _count: number
}

async function getCategories(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Category[]> {
    const { data: categories } = await supabase
        .from('product_categories')
        .select('id, name, description')
        .order('name')

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

    return (categories || []).map(c => ({
        ...c,
        _count: counts[c.id] || 0,
    }))
}

export default async function CategoriesPage() {
    const supabase = await createClient()
    const categories = await getCategories(supabase)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/inventory"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Inventario
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Categorías</h1>
                <p className="text-foreground-secondary">
                    Organiza tus productos en categorías
                </p>
            </div>

            <CategoriesClient categories={categories} />
        </div>
    )
}
