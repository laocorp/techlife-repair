import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PlanSelectButton } from './plan-select-button'

export const metadata = {
    title: 'Facturación y Plan',
}

interface Plan {
    id: string
    name: string
    price_monthly: number
    price_yearly: number
    max_users: number
    max_clients: number
    features: { modules?: string[] }
}

async function getPlans(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Plan[]> {
    const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly')
    return (data || []) as Plan[]
}

async function getTenantData(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData?.tenant_id) return null

    const { data: tenant } = await supabase
        .from('tenants')
        .select(`
            *,
            plan:plans(*)
        `)
        .eq('id', userData.tenant_id)
        .single()

    // Get usage counts
    const [usersResult, clientsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', userData.tenant_id),
        supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', userData.tenant_id),
    ])

    return {
        ...tenant,
        plan: Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan,
        usage: {
            users: usersResult.count || 0,
            clients: clientsResult.count || 0,
        },
    }
}

const ALL_MODULES = ['clients', 'work_orders', 'reports', 'inventory', 'invoices', 'accounting']
const MODULE_LABELS: Record<string, string> = {
    clients: 'Clientes',
    work_orders: 'Órdenes de Trabajo',
    reports: 'Informes Técnicos',
    inventory: 'Inventario',
    invoices: 'Facturación',
    accounting: 'Contabilidad',
}

export default async function BillingPage() {
    const supabase = await createClient()
    const [plans, tenantData] = await Promise.all([
        getPlans(supabase),
        getTenantData(supabase),
    ])

    const currentPlan = tenantData?.plan as Plan | null
    const usage = tenantData?.usage || { users: 0, clients: 0 }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Facturación y Plan</h1>
                <p className="text-foreground-secondary">
                    Gestiona tu suscripción y ve el uso actual
                </p>
            </div>

            {/* Current Plan & Usage */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Plan Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {currentPlan?.name || 'Trial'}
                                </p>
                                <Badge variant={tenantData?.subscription_status === 'active' ? 'success' : 'info'}>
                                    {tenantData?.subscription_status || 'trial'}
                                </Badge>
                            </div>
                            {currentPlan && (
                                <p className="text-2xl font-semibold text-primary">
                                    {formatCurrency(currentPlan.price_monthly)}
                                    <span className="text-sm font-normal text-foreground-muted">/mes</span>
                                </p>
                            )}
                        </div>

                        {tenantData?.trial_ends_at && tenantData.subscription_status === 'trial' && (
                            <p className="text-sm text-foreground-secondary">
                                Tu trial termina el {new Date(tenantData.trial_ends_at).toLocaleDateString('es-EC')}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Uso Actual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Users */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground-secondary">Usuarios</span>
                                <span className="text-sm font-medium">
                                    {usage.users} / {currentPlan?.max_users === -1 ? '∞' : (currentPlan?.max_users || 2)}
                                </span>
                            </div>
                            <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, (usage.users / (currentPlan?.max_users || 2)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Clients */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground-secondary">Clientes</span>
                                <span className="text-sm font-medium">
                                    {usage.clients} / {currentPlan?.max_clients === -1 ? '∞' : (currentPlan?.max_clients || 20)}
                                </span>
                            </div>
                            <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-info rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, (usage.clients / (currentPlan?.max_clients || 20)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Available Plans */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Planes Disponibles</h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentPlan?.id === plan.id
                        const planModules = plan.features?.modules || []

                        return (
                            <Card
                                key={plan.id}
                                className={isCurrentPlan ? 'ring-2 ring-primary' : ''}
                            >
                                <CardContent className="pt-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                                        <p className="text-3xl font-bold text-foreground">
                                            {formatCurrency(plan.price_monthly)}
                                            <span className="text-sm font-normal text-foreground-muted">/mes</span>
                                        </p>
                                        <p className="text-sm text-foreground-muted">
                                            o {formatCurrency(plan.price_yearly)}/año
                                        </p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-success" />
                                            <span>{plan.max_users === -1 ? 'Usuarios ilimitados' : `${plan.max_users} usuarios`}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-success" />
                                            <span>{plan.max_clients === -1 ? 'Clientes ilimitados' : `${plan.max_clients} clientes`}</span>
                                        </div>

                                        {ALL_MODULES.map((mod) => (
                                            <div key={mod} className="flex items-center gap-2 text-sm">
                                                {planModules.includes(mod) ? (
                                                    <Check className="h-4 w-4 text-success" />
                                                ) : (
                                                    <X className="h-4 w-4 text-foreground-muted" />
                                                )}
                                                <span className={!planModules.includes(mod) ? 'text-foreground-muted' : ''}>
                                                    {MODULE_LABELS[mod]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <PlanSelectButton
                                        planId={plan.id}
                                        planName={plan.name}
                                        isCurrentPlan={isCurrentPlan}
                                    />
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Contact */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-foreground">¿Necesitas un plan personalizado?</h3>
                            <p className="text-sm text-foreground-secondary">
                                Contáctanos para planes enterprise con funcionalidades adicionales
                            </p>
                        </div>
                        <Button variant="outline">
                            Contactar Ventas
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
