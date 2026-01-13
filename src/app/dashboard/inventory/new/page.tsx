import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from './product-form'

export const metadata = {
    title: 'Nuevo Producto',
}

interface Category {
    id: string
    name: string
}

async function getCategories(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Category[]> {
    const { data } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name')

    return (data || []) as Category[]
}

export default async function NewProductPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const categories = await getCategories(supabase)

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/inventory"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Inventario
                </Link>
            </div>

            <ProductForm categories={categories} />
        </div>
    )
}
