'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export interface Webhook {
    id?: string
    tenant_id?: string
    name: string
    description?: string
    url: string
    secret?: string
    events: string[]
    headers?: Record<string, string>
    is_active: boolean
    max_retries?: number
    created_at?: string
    updated_at?: string
}

export interface WebhookLog {
    id: string
    webhook_id: string
    event_type: string
    payload: any
    request_url: string
    status_code: number | null
    response_body: string | null
    response_time_ms: number | null
    error: string | null
    retry_count: number
    created_at: string
    completed_at: string | null
}

// =====================================================
// HELPER: Get Current Tenant
// =====================================================

async function getCurrentTenantId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    return userData?.tenant_id || null
}

// =====================================================
// HELPER: Generate Secret Key
// =====================================================

function generateSecret(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// =====================================================
// ACTION: Get All Webhooks
// =====================================================

export async function getWebhooksAction(): Promise<{
    success: boolean
    data?: Webhook[]
    error?: string
}> {
    const supabase = await createClient()
    const tenantId = await getCurrentTenantId(supabase)

    if (!tenantId) {
        return { success: false, error: 'Tenant no encontrado' }
    }

    const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data: data as Webhook[] }
}

// =====================================================
// ACTION: Get Available Events
// =====================================================

export async function getWebhookEventsAction(): Promise<{
    success: boolean
    data?: any[]
    error?: string
}> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

// =====================================================
// ACTION: Create Webhook
// =====================================================

export async function createWebhookAction(
    webhook: Omit<Webhook, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string; id?: string }> {
    const supabase = await createClient()
    const tenantId = await getCurrentTenantId(supabase)

    if (!tenantId) {
        return { success: false, error: 'Tenant no encontrado' }
    }

    // Validaciones
    if (!webhook.name || webhook.name.trim() === '') {
        return { success: false, error: 'El nombre es requerido' }
    }

    if (!webhook.url || !webhook.url.match(/^https?:\/\//)) {
        return { success: false, error: 'URL inválida. Debe comenzar con http:// o https://' }
    }

    if (!webhook.events || webhook.events.length === 0) {
        return { success: false, error: 'Debes seleccionar al menos un evento' }
    }

    // Generar secret si no se proporcionó
    const secret = webhook.secret || generateSecret()

    // Get current user ID from users table (not auth.users)
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        return { success: false, error: 'Usuario no autenticado' }
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single()

    const { data, error } = await supabase
        .from('webhooks')
        .insert({
            tenant_id: tenantId,
            name: webhook.name,
            description: webhook.description,
            url: webhook.url,
            secret,
            events: webhook.events,
            headers: webhook.headers || {},
            is_active: webhook.is_active ?? true,
            max_retries: webhook.max_retries ?? 3,
            created_by: currentUser?.id, // Use users.id, not auth.uid
        })
        .select('id')
        .single()

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/webhooks')
    return { success: true, id: data.id }
}

// =====================================================
// ACTION: Update Webhook
// =====================================================

export async function updateWebhookAction(
    id: string,
    updates: Partial<Omit<Webhook, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Validaciones
    if (updates.url && !updates.url.match(/^https?:\/\//)) {
        return { success: false, error: 'URL inválida' }
    }

    if (updates.events && updates.events.length === 0) {
        return { success: false, error: 'Debes seleccionar al menos un evento' }
    }

    const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/webhooks')
    return { success: true }
}

// =====================================================
// ACTION: Delete Webhook
// =====================================================

export async function deleteWebhookAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/webhooks')
    return { success: true }
}

// =====================================================
// ACTION: Toggle Webhook Active Status
// =====================================================

export async function toggleWebhookAction(
    id: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('webhooks')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/webhooks')
    return { success: true }
}

// =====================================================
// ACTION: Test Webhook (Send Test Event)
// =====================================================

export async function testWebhookAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Get webhook details
    const { data: webhook, error: fetchError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !webhook) {
        return { success: false, error: 'Webhook no encontrado' }
    }

    try {
        // Call the new RPC function to send a real test webhook
        const { data, error } = await supabase.rpc('send_test_webhook', {
            p_webhook_id: webhook.id
        })

        if (error) throw error

        // RPC returns JSON with result
        const result = data as any
        if (result && !result.success) {
            throw new Error(result.error || 'Error desconocido al enviar webhook')
        }

        return {
            success: true,
            error: 'Test enviado correctamente a n8n (Async)'
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// =====================================================
// ACTION: Get Webhook Logs
// =====================================================

export async function getWebhookLogsAction(
    webhookId: string,
    limit: number = 100
): Promise<{ success: boolean; data?: WebhookLog[]; error?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data: data as WebhookLog[] }
}

// =====================================================
// ACTION: Get Webhook Stats
// =====================================================

export async function getWebhookStatsAction(
    webhookId: string
): Promise<{
    success: boolean
    data?: {
        total_deliveries: number
        successful: number
        failed: number
        last_success: string | null
        last_failure: string | null
    }
    error?: string
}> {
    const supabase = await createClient()

    // Get counts
    const { count: total } = await supabase
        .from('webhook_logs')
        .select('*', { count: 'exact', head: true })
        .eq('webhook_id', webhookId)

    const { count: successful } = await supabase
        .from('webhook_logs')
        .select('*', { count: 'exact', head: true })
        .eq('webhook_id', webhookId)
        .not('status_code', 'is', null)
        .gte('status_code', 200)
        .lt('status_code', 300)

    const { count: failed } = await supabase
        .from('webhook_logs')
        .select('*', { count: 'exact', head: true })
        .eq('webhook_id', webhookId)
        .not('error', 'is', null)

    // Get last success
    const { data: lastSuccess } = await supabase
        .from('webhook_logs')
        .select('created_at')
        .eq('webhook_id', webhookId)
        .not('status_code', 'is', null)
        .gte('status_code', 200)
        .lt('status_code', 300)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // Get last failure
    const { data: lastFailure } = await supabase
        .from('webhook_logs')
        .select('created_at')
        .eq('webhook_id', webhookId)
        .not('error', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return {
        success: true,
        data: {
            total_deliveries: total || 0,
            successful: successful || 0,
            failed: failed || 0,
            last_success: lastSuccess?.created_at || null,
            last_failure: lastFailure?.created_at || null,
        },
    }
}
