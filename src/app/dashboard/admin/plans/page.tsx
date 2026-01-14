import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { PlanActions } from './plan-actions'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Planes - Super Admin',
}

interface Plan {
    id: string
    name: string
    price_monthly: number
    price_yearly: number
    max_users: number | null
    max_work_orders: number | null
    features: string[]
    is_active: boolean
    _tenant_count: number
}

async function getPlans(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Plan[]> {
    const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true })

    if (!plans) return []

    // Get tenant counts
    const { data: tenants } = await supabase
        .from('tenants')
        .select('plan_id')

    const tenantCounts: Record<string, number> = {}
    tenants?.forEach(t => {
        if (t.plan_id) {
            tenantCounts[t.plan_id] = (tenantCounts[t.plan_id] || 0) + 1
        }
    })

    return plans.map(p => ({
        ...p,
        _tenant_count: tenantCounts[p.id] || 0,
    }))
}

export default async function PlansPage() {
    const supabase = await createClient()
    const plans = await getPlans(supabase)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Gestión de Planes</h2>
                    <p className="text-foreground-secondary">Configurar precios y características</p>
                </div>
                <Link href="/dashboard/admin/plans/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Plan
                    </Button>
                </Link>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                    <p className="text-2xl font-bold text-foreground mt-2">
                                        {formatCurrency(plan.price_monthly)}
                                        <span className="text-sm font-normal text-foreground-secondary">/mes</span>
                                    </p>
                                    <p className="text-sm text-foreground-muted">
                                        {formatCurrency(plan.price_yearly)}/año
                                    </p>
                                </div>
                                <PlanActions
                                    planId={plan.id}
                                    isActive={plan.is_active}
                                    hasTenants={plan._tenant_count > 0}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <p className="text-foreground-secondary">
                                    <span className="font-medium">Límites:</span>
                                </p>
                                <ul className="space-y-1 text-foreground-muted">
                                    <li>• Usuarios: {plan.max_users || 'Ilimitado'}</li>
                                    <li>• Órdenes: {plan.max_work_orders || 'Ilimitado'}</li>
                                </ul>
                                {plan.features && plan.features.length > 0 && (
                                    <>
                                        <p className="text-foreground-secondary font-medium mt-3">Características:</p>
                                        <ul className="space-y-1 text-foreground-muted">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx}>• {feature}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                <p className="text-xs text-foreground-muted pt-3">
                                    {plan._tenant_count} empresa{plan._tenant_count !== 1 ? 's' : ''} con este plan
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {plans.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-foreground-muted">
                        No hay planes creados
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
