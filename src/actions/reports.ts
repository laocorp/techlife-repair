'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ReportSchema = z.object({
    work_order_id: z.string().uuid('Orden inválida'),
    diagnosis: z.string().min(10, 'El diagnóstico debe tener al menos 10 caracteres'),
    work_performed: z.string().min(10, 'El trabajo realizado debe tener al menos 10 caracteres'),
    parts_used: z.string().optional(),
    recommendations: z.string().optional(),
})

export type ReportFormState = {
    errors?: {
        work_order_id?: string[]
        diagnosis?: string[]
        work_performed?: string[]
        parts_used?: string[]
        recommendations?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
    reportId?: string
}

export async function createReportAction(
    prevState: ReportFormState,
    formData: FormData
): Promise<ReportFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const { data: userData } = await supabase
        .from('users')
        .select('id, tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) {
        return { errors: { _form: ['Usuario no encontrado'] } }
    }

    const validatedFields = ReportSchema.safeParse({
        work_order_id: formData.get('work_order_id'),
        diagnosis: formData.get('diagnosis'),
        work_performed: formData.get('work_performed'),
        parts_used: formData.get('parts_used') || undefined,
        recommendations: formData.get('recommendations') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    // Parse parts_used as JSON array if provided
    let partsArray: string[] = []
    if (validatedFields.data.parts_used) {
        partsArray = validatedFields.data.parts_used
            .split('\n')
            .map(p => p.trim())
            .filter(Boolean)
    }

    const { data: newReport, error } = await supabase
        .from('technical_reports')
        .insert({
            tenant_id: userData.tenant_id,
            work_order_id: validatedFields.data.work_order_id,
            technician_id: userData.id,
            diagnosis: validatedFields.data.diagnosis,
            work_performed: validatedFields.data.work_performed,
            parts_used: partsArray,
            recommendations: validatedFields.data.recommendations || null,
        })
        .select('id')
        .single()

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    // Update work order diagnosis
    await supabase
        .from('work_orders')
        .update({ diagnosis: validatedFields.data.diagnosis })
        .eq('id', validatedFields.data.work_order_id)

    revalidatePath('/dashboard/work-orders')
    revalidatePath(`/dashboard/work-orders/${validatedFields.data.work_order_id}`)
    return { success: true, message: 'Informe creado exitosamente', reportId: newReport?.id }
}

export async function updateReportAction(
    id: string,
    prevState: ReportFormState,
    formData: FormData
): Promise<ReportFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    const validatedFields = ReportSchema.safeParse({
        work_order_id: formData.get('work_order_id'),
        diagnosis: formData.get('diagnosis'),
        work_performed: formData.get('work_performed'),
        parts_used: formData.get('parts_used') || undefined,
        recommendations: formData.get('recommendations') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    let partsArray: string[] = []
    if (validatedFields.data.parts_used) {
        partsArray = validatedFields.data.parts_used
            .split('\n')
            .map(p => p.trim())
            .filter(Boolean)
    }

    const { error } = await supabase
        .from('technical_reports')
        .update({
            diagnosis: validatedFields.data.diagnosis,
            work_performed: validatedFields.data.work_performed,
            parts_used: partsArray,
            recommendations: validatedFields.data.recommendations || null,
        })
        .eq('id', id)

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath(`/dashboard/work-orders/${validatedFields.data.work_order_id}`)
    return { success: true, message: 'Informe actualizado exitosamente' }
}
