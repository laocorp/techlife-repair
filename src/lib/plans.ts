import { createClient } from '@/lib/supabase/server'

export interface PlanLimits {
    maxUsers: number
    maxClients: number
    modules: string[]
}

export interface UsageStats {
    users: number
    clients: number
}

export interface PlanCheckResult {
    canCreate: boolean
    reason?: string
    limit?: number
    current?: number
}

// Get plan limits for current tenant
export async function getPlanLimits(): Promise<PlanLimits | null> {
    const supabase = await createClient()

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
            plan:plans(
                max_users,
                max_clients,
                features
            )
        `)
        .eq('id', userData.tenant_id)
        .single()

    if (!tenant?.plan) {
        // Default trial limits if no plan assigned
        return {
            maxUsers: 2,
            maxClients: 20,
            modules: ['clients', 'work_orders', 'reports'],
        }
    }

    // Handle both single object and array from Supabase
    const planData = Array.isArray(tenant.plan) ? tenant.plan[0] : tenant.plan
    if (!planData) {
        return {
            maxUsers: 2,
            maxClients: 20,
            modules: ['clients', 'work_orders', 'reports'],
        }
    }

    const plan = planData as { max_users: number; max_clients: number; features: { modules?: string[] } | null }

    return {
        maxUsers: plan.max_users ?? 2,
        maxClients: plan.max_clients ?? 20,
        modules: plan.features?.modules || ['clients', 'work_orders', 'reports'],
    }
}

// Get current usage stats
export async function getUsageStats(): Promise<UsageStats> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { users: 0, clients: 0 }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData?.tenant_id) return { users: 0, clients: 0 }

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
        users: usersResult.count || 0,
        clients: clientsResult.count || 0,
    }
}

// Check if can create more users
export async function canCreateUser(): Promise<PlanCheckResult> {
    const [limits, usage] = await Promise.all([
        getPlanLimits(),
        getUsageStats(),
    ])

    if (!limits) {
        return { canCreate: false, reason: 'No se pudo verificar el plan' }
    }

    // -1 means unlimited
    if (limits.maxUsers === -1) {
        return { canCreate: true }
    }

    if (usage.users >= limits.maxUsers) {
        return {
            canCreate: false,
            reason: `Has alcanzado el límite de ${limits.maxUsers} usuarios de tu plan`,
            limit: limits.maxUsers,
            current: usage.users,
        }
    }

    return { canCreate: true, limit: limits.maxUsers, current: usage.users }
}

// Check if can create more clients
export async function canCreateClient(): Promise<PlanCheckResult> {
    const [limits, usage] = await Promise.all([
        getPlanLimits(),
        getUsageStats(),
    ])

    if (!limits) {
        return { canCreate: false, reason: 'No se pudo verificar el plan' }
    }

    // -1 means unlimited
    if (limits.maxClients === -1) {
        return { canCreate: true }
    }

    if (usage.clients >= limits.maxClients) {
        return {
            canCreate: false,
            reason: `Has alcanzado el límite de ${limits.maxClients} clientes de tu plan`,
            limit: limits.maxClients,
            current: usage.clients,
        }
    }

    return { canCreate: true, limit: limits.maxClients, current: usage.clients }
}

// Check if module is available in current plan
export async function hasModuleAccess(module: string): Promise<boolean> {
    const limits = await getPlanLimits()
    if (!limits) return false
    return limits.modules.includes(module)
}

// Module names for UI
export const MODULE_NAMES: Record<string, string> = {
    clients: 'Clientes',
    work_orders: 'Órdenes de Trabajo',
    reports: 'Informes Técnicos',
    inventory: 'Inventario',
    invoices: 'Facturación',
    accounting: 'Contabilidad',
    payments: 'Pagos',
}
