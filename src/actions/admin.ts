'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function updateTenantStatusAction(
    tenantId: string,
    status: 'active' | 'suspended'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ status })
        .eq('id', tenantId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function updateSubscriptionStatusAction(
    tenantId: string,
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ subscription_status: subscriptionStatus })
        .eq('id', tenantId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function changeTenantPlanAction(
    tenantId: string,
    planId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ plan_id: planId })
        .eq('id', tenantId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function extendTrialAction(
    tenantId: string,
    days: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)

    const { error } = await supabase
        .from('tenants')
        .update({ trial_ends_at: newDate.toISOString() })
        .eq('id', tenantId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function deleteTenantAction(
    tenantId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    // Check if tenant has users
    const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)

    if (users && users.length > 0) {
        return { success: false, error: 'Elimina primero todos los usuarios de esta empresa' }
    }

    const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
}

// ========== NEW: Global User Management ==========

export async function updateUserRoleAction(
    userId: string,
    role: 'admin' | 'technician' | 'user'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

export async function toggleUserStatusAction(
    userId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

// ========== NEW: Plan Management ==========

export async function upsertPlanAction(
    plan: {
        id?: string
        name: string
        price_monthly: number
        price_yearly: number
        max_users: number
        max_clients: number
        max_work_orders: number
        features: { modules?: string[] }
        is_active: boolean
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    const { error } = await supabase
        .from('plans')
        .upsert({
            ...plan,
        })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/plans')
    revalidatePath('/dashboard/settings/billing')
    revalidatePath('/')
    return { success: true }
}

export async function deletePlanAction(
    planId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    if (!await checkSuperAdmin(supabase)) {
        return { success: false, error: 'No autorizado' }
    }

    // Check if plan has tenants
    const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('plan_id', planId)
        .limit(1)

    if (tenants && tenants.length > 0) {
        return { success: false, error: 'No puedes eliminar un plan que tiene empresas asignadas' }
    }

    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/plans')
    return { success: true }
}
