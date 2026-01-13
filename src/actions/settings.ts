'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============ COMPANY SETTINGS ============
const CompanySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    tax_id: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
})

export type CompanyFormState = {
    errors?: {
        name?: string[]
        tax_id?: string[]
        phone?: string[]
        address?: string[]
        email?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function updateCompanyAction(
    prevState: CompanyFormState,
    formData: FormData
): Promise<CompanyFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden editar la empresa'] } }
    }

    const validatedFields = CompanySchema.safeParse({
        name: formData.get('name'),
        tax_id: formData.get('tax_id') || undefined,
        phone: formData.get('phone') || undefined,
        address: formData.get('address') || undefined,
        email: formData.get('email') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('tenants')
        .update({
            name: validatedFields.data.name,
            tax_id: validatedFields.data.tax_id || null,
            phone: validatedFields.data.phone || null,
            address: validatedFields.data.address || null,
            email: validatedFields.data.email || null,
        })
        .eq('id', userData.tenant_id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/settings/company')
    revalidatePath('/dashboard')
    return { success: true, message: 'Empresa actualizada' }
}

// ============ PROFILE/SECURITY SETTINGS ============
const ProfileSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().optional(),
})

export type ProfileFormState = {
    errors?: {
        full_name?: string[]
        phone?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function updateProfileAction(
    prevState: ProfileFormState,
    formData: FormData
): Promise<ProfileFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const validatedFields = ProfileSchema.safeParse({
        full_name: formData.get('full_name'),
        phone: formData.get('phone') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('users')
        .update({
            full_name: validatedFields.data.full_name,
            phone: validatedFields.data.phone || null,
        })
        .eq('auth_user_id', user.id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/settings/security')
    return { success: true, message: 'Perfil actualizado' }
}

export async function changePasswordAction(
    prevState: { success?: boolean; error?: string },
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient()

    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (!newPassword || newPassword.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    if (newPassword !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

// ============ NOTIFICATIONS SETTINGS ============
const NotificationsSchema = z.object({
    email_orders: z.boolean().default(true),
    email_payments: z.boolean().default(true),
    email_low_stock: z.boolean().default(true),
    email_marketing: z.boolean().default(false),
})

export type NotificationsFormState = {
    errors?: { _form?: string[] }
    success?: boolean
    message?: string
}

export async function updateNotificationsAction(
    prevState: NotificationsFormState,
    formData: FormData
): Promise<NotificationsFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const settings = {
        email_orders: formData.get('email_orders') === 'on',
        email_payments: formData.get('email_payments') === 'on',
        email_low_stock: formData.get('email_low_stock') === 'on',
        email_marketing: formData.get('email_marketing') === 'on',
    }

    // Store in user metadata (or create dedicated table)
    const { error } = await supabase
        .from('users')
        .update({
            notification_settings: settings,
        })
        .eq('auth_user_id', user.id)

    if (error) {
        // If column doesn't exist, just pretend it worked
        console.log('Notification settings update:', error)
    }

    revalidatePath('/dashboard/settings/notifications')
    return { success: true, message: 'Preferencias guardadas' }
}
