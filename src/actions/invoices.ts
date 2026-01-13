'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InvoiceSchema = z.object({
    client_id: z.string().uuid('Cliente inválido'),
    work_order_id: z.string().uuid().optional().nullable(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    tax_rate: z.coerce.number().min(0).max(100).default(12),
    discount: z.coerce.number().min(0).default(0),
})

const InvoiceLineSchema = z.object({
    product_id: z.string().uuid().optional().nullable(),
    description: z.string().min(1, 'Descripción requerida'),
    quantity: z.coerce.number().min(0.01, 'Cantidad inválida'),
    unit_price: z.coerce.number().min(0, 'Precio inválido'),
    discount: z.coerce.number().min(0).default(0),
})

export type InvoiceFormState = {
    errors?: {
        client_id?: string[]
        work_order_id?: string[]
        due_date?: string[]
        notes?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
    invoiceId?: string
}

async function generateInvoiceNumber(
    supabase: Awaited<ReturnType<typeof createClient>>,
    tenantId: string
): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `FAC-${year}-`

    const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('tenant_id', tenantId)
        .like('invoice_number', `${prefix}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let nextNumber = 1
    if (data?.invoice_number) {
        const lastNumber = parseInt(data.invoice_number.replace(prefix, ''), 10)
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1
        }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

export async function createInvoiceAction(
    prevState: InvoiceFormState,
    formData: FormData
): Promise<InvoiceFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden crear facturas'] } }
    }

    const validatedFields = InvoiceSchema.safeParse({
        client_id: formData.get('client_id'),
        work_order_id: formData.get('work_order_id') || null,
        due_date: formData.get('due_date') || undefined,
        notes: formData.get('notes') || undefined,
        tax_rate: formData.get('tax_rate') || 12,
        discount: formData.get('discount') || 0,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const invoiceNumber = await generateInvoiceNumber(supabase, userData.tenant_id)

    const { data: newInvoice, error } = await supabase
        .from('invoices')
        .insert({
            tenant_id: userData.tenant_id,
            invoice_number: invoiceNumber,
            client_id: validatedFields.data.client_id,
            work_order_id: validatedFields.data.work_order_id || null,
            due_date: validatedFields.data.due_date || null,
            notes: validatedFields.data.notes || null,
            tax_rate: validatedFields.data.tax_rate,
            discount: validatedFields.data.discount,
            status: 'draft',
            subtotal: 0,
            tax_amount: 0,
            total: 0,
        })
        .select('id')
        .single()

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/invoices')
    return { success: true, message: 'Factura creada', invoiceId: newInvoice?.id }
}

export async function addInvoiceLineAction(
    invoiceId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const validatedFields = InvoiceLineSchema.safeParse({
        product_id: formData.get('product_id') || null,
        description: formData.get('description'),
        quantity: formData.get('quantity'),
        unit_price: formData.get('unit_price'),
        discount: formData.get('discount') || 0,
    })

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors
        return { success: false, error: Object.values(errors).flat().join(', ') }
    }

    const lineTotal = (validatedFields.data.quantity * validatedFields.data.unit_price) - validatedFields.data.discount

    const { error } = await supabase
        .from('invoice_lines')
        .insert({
            invoice_id: invoiceId,
            product_id: validatedFields.data.product_id || null,
            description: validatedFields.data.description,
            quantity: validatedFields.data.quantity,
            unit_price: validatedFields.data.unit_price,
            discount: validatedFields.data.discount,
            total: lineTotal,
        })

    if (error) {
        return { success: false, error: error.message }
    }

    // Recalculate invoice totals
    await recalculateInvoiceTotals(supabase, invoiceId)

    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    return { success: true }
}

export async function removeInvoiceLineAction(
    lineId: string,
    invoiceId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('invoice_lines')
        .delete()
        .eq('id', lineId)

    if (error) {
        return { success: false, error: error.message }
    }

    await recalculateInvoiceTotals(supabase, invoiceId)

    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    return { success: true }
}

async function recalculateInvoiceTotals(
    supabase: Awaited<ReturnType<typeof createClient>>,
    invoiceId: string
) {
    // Get invoice and lines
    const { data: invoice } = await supabase
        .from('invoices')
        .select('tax_rate, discount')
        .eq('id', invoiceId)
        .single()

    const { data: lines } = await supabase
        .from('invoice_lines')
        .select('total')
        .eq('invoice_id', invoiceId)

    if (!invoice) return

    const subtotal = lines?.reduce((sum, l) => sum + (l.total || 0), 0) || 0
    const taxAmount = subtotal * (invoice.tax_rate / 100)
    const total = subtotal + taxAmount - (invoice.discount || 0)

    await supabase
        .from('invoices')
        .update({
            subtotal,
            tax_amount: taxAmount,
            total,
        })
        .eq('id', invoiceId)
}

export async function updateInvoiceStatusAction(
    invoiceId: string,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { status }

    if (status === 'paid') {
        updates.paid_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/invoices/${invoiceId}`)
    return { success: true }
}

export async function deleteInvoiceAction(
    invoiceId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Only allow deleting draft invoices
    const { data: invoice } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', invoiceId)
        .single()

    if (invoice?.status !== 'draft') {
        return { success: false, error: 'Solo se pueden eliminar facturas en borrador' }
    }

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/invoices')
    return { success: true }
}
