'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { canCreateUser } from '@/lib/plans'

const InviteUserSchema = z.object({
    email: z.string().email('Email inválido'),
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    role: z.enum(['admin', 'technician', 'receptionist']),
    phone: z.string().optional(),
})

const UpdateUserSchema = z.object({
    role: z.enum(['admin', 'technician', 'receptionist']),
    is_active: z.boolean(),
})

export type TeamFormState = {
    errors?: {
        email?: string[]
        full_name?: string[]
        role?: string[]
        phone?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function inviteTeamMemberAction(
    prevState: TeamFormState,
    formData: FormData
): Promise<TeamFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!currentUser || currentUser.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden invitar usuarios'] } }
    }

    // Check plan limits
    const planCheck = await canCreateUser()
    if (!planCheck.canCreate) {
        return { errors: { _form: [planCheck.reason || 'Límite de usuarios alcanzado. Actualiza tu plan.'] } }
    }

    const validatedFields = InviteUserSchema.safeParse({
        email: formData.get('email'),
        full_name: formData.get('full_name'),
        role: formData.get('role'),
        phone: formData.get('phone') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    // Check if email already exists in tenant
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', currentUser.tenant_id)
        .eq('email', validatedFields.data.email)
        .single()

    if (existingUser) {
        return { errors: { email: ['Este email ya está registrado en tu equipo'] } }
    }

    // For now, create a placeholder user that will be linked when they sign up
    // In production, you'd send an invitation email
    const { error } = await supabase.from('users').insert({
        tenant_id: currentUser.tenant_id,
        auth_user_id: crypto.randomUUID(), // Placeholder - will be updated on signup
        email: validatedFields.data.email,
        full_name: validatedFields.data.full_name,
        role: validatedFields.data.role,
        phone: validatedFields.data.phone || null,
        is_active: false, // Pending activation
    })

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/team')
    return { success: true, message: 'Invitación enviada exitosamente' }
}

export async function updateTeamMemberAction(
    userId: string,
    prevState: TeamFormState,
    formData: FormData
): Promise<TeamFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!currentUser || currentUser.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden editar usuarios'] } }
    }

    const validatedFields = UpdateUserSchema.safeParse({
        role: formData.get('role'),
        is_active: formData.get('is_active') === 'true',
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('users')
        .update({
            role: validatedFields.data.role,
            is_active: validatedFields.data.is_active,
        })
        .eq('id', userId)
        .eq('tenant_id', currentUser.tenant_id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/team')
    return { success: true, message: 'Usuario actualizado' }
}

export async function removeTeamMemberAction(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'No autorizado' }
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('id, tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden eliminar usuarios' }
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
        return { success: false, error: 'No puedes eliminarte a ti mismo' }
    }

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('tenant_id', currentUser.tenant_id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/team')
    return { success: true }
}
