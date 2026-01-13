'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { canCreateClient } from '@/lib/plans'

// Validation schema
const ClientSchema = z.object({
    company_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    tax_id: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
})

export type ClientFormState = {
    errors?: {
        company_name?: string[]
        tax_id?: string[]
        email?: string[]
        phone?: string[]
        address?: string[]
        notes?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function createClientAction(
    prevState: ClientFormState,
    formData: FormData
): Promise<ClientFormState> {
    const supabase = await createSupabaseClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    // Get user's tenant
    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) {
        return { errors: { _form: ['Usuario no encontrado'] } }
    }

    if (userData.role !== 'admin') {
        return { errors: { _form: ['No tienes permisos para crear clientes'] } }
    }

    // Validate form data
    const validatedFields = ClientSchema.safeParse({
        company_name: formData.get('company_name'),
        tax_id: formData.get('tax_id') || undefined,
        email: formData.get('email') || undefined,
        phone: formData.get('phone') || undefined,
        address: formData.get('address') || undefined,
        notes: formData.get('notes') || undefined,
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Check plan limits
    const planCheck = await canCreateClient()
    if (!planCheck.canCreate) {
        return { errors: { _form: [planCheck.reason || 'Límite de clientes alcanzado. Actualiza tu plan.'] } }
    }

    // Insert client
    const { error } = await supabase.from('clients').insert({
        tenant_id: userData.tenant_id,
        company_name: validatedFields.data.company_name,
        tax_id: validatedFields.data.tax_id || null,
        email: validatedFields.data.email || null,
        phone: validatedFields.data.phone || null,
        address: validatedFields.data.address || null,
        notes: validatedFields.data.notes || null,
    })

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/clients')
    return { success: true, message: 'Cliente creado exitosamente' }
}

export async function updateClientAction(
    id: string,
    prevState: ClientFormState,
    formData: FormData
): Promise<ClientFormState> {
    const supabase = await createSupabaseClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    // Validate form data
    const validatedFields = ClientSchema.safeParse({
        company_name: formData.get('company_name'),
        tax_id: formData.get('tax_id') || undefined,
        email: formData.get('email') || undefined,
        phone: formData.get('phone') || undefined,
        address: formData.get('address') || undefined,
        notes: formData.get('notes') || undefined,
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Update client (RLS will handle tenant check)
    const { error } = await supabase
        .from('clients')
        .update({
            company_name: validatedFields.data.company_name,
            tax_id: validatedFields.data.tax_id || null,
            email: validatedFields.data.email || null,
            phone: validatedFields.data.phone || null,
            address: validatedFields.data.address || null,
            notes: validatedFields.data.notes || null,
        })
        .eq('id', id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/clients')
    revalidatePath(`/dashboard/clients/${id}`)
    return { success: true, message: 'Cliente actualizado exitosamente' }
}

export async function deleteClientAction(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/clients')
    return { success: true }
}
