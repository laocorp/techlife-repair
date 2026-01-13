'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { createCategoryAction, deleteCategoryAction, type CategoryFormState } from '@/actions/inventory'
import { Plus, Trash2, Layers } from 'lucide-react'

interface Category {
    id: string
    name: string
    description: string | null
    _count: number
}

interface CategoriesClientProps {
    categories: Category[]
}

const initialState: CategoryFormState = {}

export function CategoriesClient({ categories }: CategoriesClientProps) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createCategoryAction, initialState)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría?')) return

        setDeletingId(id)
        const result = await deleteCategoryAction(id)

        if (!result.success) {
            alert(result.error || 'Error')
        }
        router.refresh()
        setDeletingId(null)
    }

    return (
        <div className="space-y-6">
            {/* Create Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nueva Categoría
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                name="name"
                                placeholder="Nombre de la categoría"
                                required
                                error={state.errors?.name?.join(', ')}
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                name="description"
                                placeholder="Descripción (opcional)"
                            />
                        </div>
                        <Button type="submit" loading={isPending}>
                            Crear
                        </Button>
                    </form>
                    {state.errors?._form && (
                        <p className="mt-2 text-xs text-error">{state.errors._form.join(', ')}</p>
                    )}
                </CardContent>
            </Card>

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                    No hay categorías. Crea la primera arriba.
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat) => (
                        <Card key={cat.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Layers className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">{cat.name}</h3>
                                            <p className="text-sm text-foreground-secondary">
                                                {cat._count} productos
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cat.id)}
                                        loading={deletingId === cat.id}
                                        disabled={cat._count > 0}
                                        className="text-error hover:bg-error/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {cat.description && (
                                    <p className="mt-2 text-sm text-foreground-muted">
                                        {cat.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
