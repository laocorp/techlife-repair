'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const WorkOrderSchema = z.object({
    client_id: z.string().uuid('Cliente inválido'),
    assigned_to: z.string().uuid('Técnico inválido').optional().nullable(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    device_type: z.string().optional(),
    device_brand: z.string().optional(),
    device_model: z.string().optional(),
    device_serial: z.string().optional(),
    problem_description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    estimated_cost: z.coerce.number().optional(),
})

export type WorkOrderFormState = {
    errors?: {
        client_id?: string[]
        assigned_to?: string[]
        priority?: string[]
        device_type?: string[]
        device_brand?: string[]
        device_model?: string[]
        device_serial?: string[]
        problem_description?: string[]
        estimated_cost?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
    orderId?: string
}

async function generateOrderNumber(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `OT-${year}-`

    const { data } = await supabase
        .from('work_orders')
        .select('order_number')
        .eq('tenant_id', tenantId)
        .like('order_number', `${prefix}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let nextNumber = 1
    if (data?.order_number) {
        const lastNumber = parseInt(data.order_number.replace(prefix, ''), 10)
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1
        }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

export async function createWorkOrderAction(
    prevState: WorkOrderFormState,
    formData: FormData
): Promise<WorkOrderFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) {
        return { errors: { _form: ['Usuario no encontrado'] } }
    }

    if (!['admin', 'receptionist'].includes(userData.role)) {
        return { errors: { _form: ['No tienes permisos para crear órdenes'] } }
    }

    const validatedFields = WorkOrderSchema.safeParse({
        client_id: formData.get('client_id'),
        assigned_to: formData.get('assigned_to') || null,
        priority: formData.get('priority') || 'normal',
        device_type: formData.get('device_type') || undefined,
        device_brand: formData.get('device_brand') || undefined,
        device_model: formData.get('device_model') || undefined,
        device_serial: formData.get('device_serial') || undefined,
        problem_description: formData.get('problem_description'),
        estimated_cost: formData.get('estimated_cost') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const orderNumber = await generateOrderNumber(supabase, userData.tenant_id)

    const { data: newOrder, error } = await supabase
        .from('work_orders')
        .insert({
            tenant_id: userData.tenant_id,
            order_number: orderNumber,
            client_id: validatedFields.data.client_id,
            assigned_to: validatedFields.data.assigned_to || null,
            priority: validatedFields.data.priority,
            device_type: validatedFields.data.device_type || null,
            device_brand: validatedFields.data.device_brand || null,
            device_model: validatedFields.data.device_model || null,
            device_serial: validatedFields.data.device_serial || null,
            problem_description: validatedFields.data.problem_description,
            estimated_cost: validatedFields.data.estimated_cost || null,
            status: 'open',
        })
        .select('id')
        .single()

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/work-orders')
    return { success: true, message: 'Orden creada exitosamente', orderId: newOrder?.id }
}

export async function updateWorkOrderStatus(
    id: string,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { status }

    if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
    } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/work-orders')
    revalidatePath(`/dashboard/work-orders/${id}`)
    return { success: true }
}

export async function updateWorkOrderAction(
    id: string,
    prevState: WorkOrderFormState,
    formData: FormData
): Promise<WorkOrderFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const validatedFields = WorkOrderSchema.safeParse({
        client_id: formData.get('client_id'),
        assigned_to: formData.get('assigned_to') || null,
        priority: formData.get('priority') || 'normal',
        device_type: formData.get('device_type') || undefined,
        device_brand: formData.get('device_brand') || undefined,
        device_model: formData.get('device_model') || undefined,
        device_serial: formData.get('device_serial') || undefined,
        problem_description: formData.get('problem_description'),
        estimated_cost: formData.get('estimated_cost') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('work_orders')
        .update({
            client_id: validatedFields.data.client_id,
            assigned_to: validatedFields.data.assigned_to || null,
            priority: validatedFields.data.priority,
            device_type: validatedFields.data.device_type || null,
            device_brand: validatedFields.data.device_brand || null,
            device_model: validatedFields.data.device_model || null,
            device_serial: validatedFields.data.device_serial || null,
            problem_description: validatedFields.data.problem_description,
            estimated_cost: validatedFields.data.estimated_cost || null,
        })
        .eq('id', id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/work-orders')
    revalidatePath(`/dashboard/work-orders/${id}`)
    return { success: true, message: 'Orden actualizada exitosamente' }
}

export async function deleteWorkOrderAction(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/work-orders')
    return { success: true }
}
