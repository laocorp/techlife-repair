import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { Building2, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TenantActions } from './tenant-actions'

export const metadata = {
    title: 'Super Admin',
}

interface Tenant {
    id: string
    name: string
    slug: string
    status: string
    subscription_status: string | null
    trial_ends_at: string | null
    created_at: string
    plan: {
        name: string
        price_monthly: number
    } | null
    _users_count: number
}

async function checkSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('auth_user_id', user.id)
        .single()

    return data?.is_super_admin === true
}

async function getTenants(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Tenant[]> {
    const { data: tenants } = await supabase
        .from('tenants')
        .select(`
      id, name, slug, status, subscription_status, trial_ends_at, created_at,
      plan:plans(name, price_monthly)
    `)
        .order('created_at', { ascending: false })

    if (!tenants) return []

    // Get user counts
    const { data: users } = await supabase
        .from('users')
        .select('tenant_id')

    const userCounts: Record<string, number> = {}
    users?.forEach(u => {
        if (u.tenant_id) {
            userCounts[u.tenant_id] = (userCounts[u.tenant_id] || 0) + 1
        }
    })

    return tenants.map(t => ({
        ...t,
        plan: t.plan as unknown as { name: string; price_monthly: number } | null,
        _users_count: userCounts[t.id] || 0,
    }))
}

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: tenants } = await supabase
        .from('tenants')
        .select('id, subscription_status, plan_id')

    const { data: plans } = await supabase
        .from('plans')
        .select('id, price_monthly')

    const planPrices: Record<string, number> = {}
    plans?.forEach(p => { planPrices[p.id] = p.price_monthly })

    const active = tenants?.filter(t => t.subscription_status === 'active').length || 0
    const trial = tenants?.filter(t => t.subscription_status === 'trial').length || 0
    const mrr = tenants?.filter(t => t.subscription_status === 'active')
        .reduce((sum, t) => sum + (planPrices[t.plan_id] || 0), 0) || 0

    return { total: tenants?.length || 0, active, trial, mrr }
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    active: 'success',
    trial: 'info',
    past_due: 'warning',
    suspended: 'error',
    cancelled: 'default',
}

export default async function SuperAdminPage() {
    const supabase = await createClient()

    const [tenants, stats] = await Promise.all([
        getTenants(supabase),
        getStats(supabase),
    ])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="warning">Super Admin</Badge>
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Panel de Administración</h1>
                <p className="text-foreground-secondary">Gestión de tenants y suscripciones</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{stats.total}</p>
                                <p className="text-sm text-foreground-secondary">Total empresas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{stats.active}</p>
                                <p className="text-sm text-foreground-secondary">Suscripciones activas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-info" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{stats.trial}</p>
                                <p className="text-sm text-foreground-secondary">En trial</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">{formatCurrency(stats.mrr)}</p>
                                <p className="text-sm text-foreground-secondary">MRR</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tenants Table */}
            <Card className="overflow-visible">
                <CardHeader>
                    <CardTitle className="text-base">Empresas Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                    {tenants.length === 0 ? (
                        <p className="text-center text-foreground-muted py-8">No hay empresas</p>
                    ) : (
                        <div className="overflow-visible">
                            <table className="w-full text-sm">
                                <thead className="bg-background-secondary">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Empresa</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Plan</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Estado</th>
                                        <th className="px-3 py-2 text-right font-medium text-foreground-secondary">Usuarios</th>
                                        <th className="px-3 py-2 text-left font-medium text-foreground-secondary">Creado</th>
                                        <th className="px-3 py-2 text-center font-medium text-foreground-secondary">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-background-secondary/50">
                                            <td className="px-3 py-3">
                                                <div>
                                                    <p className="font-medium text-foreground">{tenant.name}</p>
                                                    <p className="text-xs text-foreground-muted">{tenant.slug}</p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-foreground-secondary">
                                                {tenant.plan?.name || '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge variant={STATUS_VARIANTS[tenant.subscription_status || 'trial'] || 'default'}>
                                                    {tenant.subscription_status || 'trial'}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3 text-right">{tenant._users_count}</td>
                                            <td className="px-3 py-3 text-foreground-secondary">
                                                {formatDate(tenant.created_at)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <TenantActions
                                                    tenantId={tenant.id}
                                                    currentStatus={tenant.status}
                                                    subscriptionStatus={tenant.subscription_status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
