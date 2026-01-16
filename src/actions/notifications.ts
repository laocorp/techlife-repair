'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface Notification {
    id: string
    tenant_id: string
    user_id: string | null
    type: string
    title: string
    message: string | null
    metadata: Record<string, unknown>
    read: boolean
    created_at: string
}

export async function getNotifications(): Promise<Notification[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching notifications:', error)
        return []
    }

    return data || []
}

export async function getUnreadCount(): Promise<number> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)

    if (error) {
        console.error('Error fetching unread count:', error)
        return 0
    }

    return count || 0
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

    if (error) {
        console.error('Error marking notification as read:', error)
        return { success: false }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false }

    // Get user's tenant_id
    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) return { success: false }

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('tenant_id', userData.tenant_id)
        .eq('read', false)

    if (error) {
        console.error('Error marking all as read:', error)
        return { success: false }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

    if (error) {
        console.error('Error deleting notification:', error)
        return { success: false }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
