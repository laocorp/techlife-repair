'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { upsertPlanAction } from '@/actions/admin'
import { Save, X, Check } from 'lucide-react'

interface PlanFormProps {
    plan?: {
        id: string
        name: string
        price_monthly: number
        price_yearly: number
        max_users: number | null
        max_clients: number | null
        max_work_orders: number | null
        features: { modules?: string[] } | null
        is_active: boolean
    }
    isEdit?: boolean
}

const ALL_MODULES = [
    { id: 'clients', label: 'Clientes' },
    { id: 'work_orders', label: 'Órdenes de Trabajo' },
    { id: 'reports', label: 'Informes Técnicos' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'invoices', label: 'Facturación' },
    { id: 'accounting', label: 'Contabilidad' },
]

export function PlanForm({ plan, isEdit = false }: PlanFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeModules, setActiveModules] = useState<string[]>(
        plan?.features?.modules || []
    )

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        // Helper: empty = -1 (unlimited)
        const parseLimit = (key: string): number => {
            const value = formData.get(key)
            if (!value || value.toString().trim() === '') return -1
            return parseInt(value.toString(), 10)
        }

        const planData = {
            id: plan?.id,
            name: formData.get('name') as string,
            price_monthly: parseFloat(formData.get('price_monthly') as string),
            price_yearly: parseFloat(formData.get('price_yearly') as string),
            max_users: parseLimit('max_users'),
            max_clients: parseLimit('max_clients'),
            max_work_orders: parseLimit('max_work_orders'),
            features: { modules: activeModules },
            is_active: formData.get('is_active') === 'on',
        }

        const result = await upsertPlanAction(planData)

        if (result.success) {
            router.push('/dashboard/admin/plans')
            router.refresh()
        } else {
            alert(result.error)
            setLoading(false)
        }
    }

    const toggleModule = (moduleId: string) => {
        setActiveModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(m => m !== moduleId)
                : [...prev, moduleId]
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Editar Plan' : 'Nuevo Plan'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-foreground">
                                Nombre del Plan *
                            </label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={plan?.name}
                                required
                                placeholder="Ej: Profesional"
                            />
                        </div>
                        <div className="space-y-2 flex items-end">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    defaultChecked={plan?.is_active ?? true}
                                    className="h-4 w-4 rounded border-border"
                                />
                                <span className="text-sm text-foreground">Plan Activo</span>
                            </label>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="price_monthly" className="text-sm font-medium text-foreground">
                                Precio Mensual (USD) *
                            </label>
                            <Input
                                id="price_monthly"
                                name="price_monthly"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={plan?.price_monthly}
                                required
                                placeholder="59.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="price_yearly" className="text-sm font-medium text-foreground">
                                Precio Anual (USD) *
                            </label>
                            <Input
                                id="price_yearly"
                                name="price_yearly"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={plan?.price_yearly}
                                required
                                placeholder="590.00"
                            />
                        </div>
                    </div>

                    {/* Limits */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <label htmlFor="max_users" className="text-sm font-medium text-foreground">
                                Máximo de Usuarios
                            </label>
                            <Input
                                id="max_users"
                                name="max_users"
                                type="number"
                                min="1"
                                defaultValue={plan?.max_users === -1 ? '' : (plan?.max_users || '')}
                                placeholder="Vacío = ilimitado"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="max_clients" className="text-sm font-medium text-foreground">
                                Máximo de Clientes
                            </label>
                            <Input
                                id="max_clients"
                                name="max_clients"
                                type="number"
                                min="1"
                                defaultValue={plan?.max_clients === -1 ? '' : (plan?.max_clients || '')}
                                placeholder="Vacío = ilimitado"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="max_work_orders" className="text-sm font-medium text-foreground">
                                Máximo Órdenes/Mes
                            </label>
                            <Input
                                id="max_work_orders"
                                name="max_work_orders"
                                type="number"
                                min="1"
                                defaultValue={plan?.max_work_orders === -1 ? '' : (plan?.max_work_orders || '')}
                                placeholder="Vacío = ilimitado"
                            />
                        </div>
                    </div>

                    {/* Modules */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                            Módulos Activados
                        </label>
                        <p className="text-xs text-foreground-muted">
                            Selecciona qué funcionalidades tendrá este plan
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {ALL_MODULES.map((module) => {
                                const isActive = activeModules.includes(module.id)
                                return (
                                    <button
                                        key={module.id}
                                        type="button"
                                        onClick={() => toggleModule(module.id)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
                                            ${isActive
                                                ? 'border-success bg-success/10 text-foreground'
                                                : 'border-border bg-background-secondary text-foreground-muted hover:border-primary/30'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            h-5 w-5 rounded flex items-center justify-center border
                                            ${isActive ? 'border-success bg-success text-white' : 'border-border'}
                                        `}>
                                            {isActive && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className="text-sm font-medium">{module.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Guardando...' : 'Guardar Plan'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/dashboard/admin/plans')}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
