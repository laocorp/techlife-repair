'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PaymentSchema = z.object({
    invoice_id: z.string().uuid('Factura inválida'),
    amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
    payment_method: z.enum(['cash', 'transfer', 'card', 'check', 'other']),
    reference: z.string().optional(),
    notes: z.string().optional(),
    payment_date: z.string().optional(),
})

export type PaymentFormState = {
    errors?: {
        invoice_id?: string[]
        amount?: string[]
        payment_method?: string[]
        reference?: string[]
        notes?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

export async function createPaymentAction(
    prevState: PaymentFormState,
    formData: FormData
): Promise<PaymentFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) return { errors: { _form: ['Usuario no encontrado'] } }

    const validatedFields = PaymentSchema.safeParse({
        invoice_id: formData.get('invoice_id'),
        amount: formData.get('amount'),
        payment_method: formData.get('payment_method'),
        reference: formData.get('reference') || undefined,
        notes: formData.get('notes') || undefined,
        payment_date: formData.get('payment_date') || undefined,
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    // Get invoice to check balance
    const { data: invoice } = await supabase
        .from('invoices')
        .select('id, total, status')
        .eq('id', validatedFields.data.invoice_id)
        .single()

    if (!invoice) {
        return { errors: { _form: ['Factura no encontrada'] } }
    }

    // Get existing payments
    const { data: existingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', validatedFields.data.invoice_id)

    const totalPaid = existingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const remaining = invoice.total - totalPaid

    if (validatedFields.data.amount > remaining) {
        return { errors: { amount: [`El monto excede el saldo pendiente ($${remaining.toFixed(2)})`] } }
    }

    // Create payment
    const { error } = await supabase
        .from('payments')
        .insert({
            tenant_id: userData.tenant_id,
            invoice_id: validatedFields.data.invoice_id,
            received_by: userData.id,
            amount: validatedFields.data.amount,
            payment_method: validatedFields.data.payment_method,
            reference: validatedFields.data.reference || null,
            notes: validatedFields.data.notes || null,
            payment_date: validatedFields.data.payment_date || new Date().toISOString().split('T')[0],
        })

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    // Update invoice status
    const newTotalPaid = totalPaid + validatedFields.data.amount
    let newStatus = invoice.status

    if (newTotalPaid >= invoice.total) {
        newStatus = 'paid'
    } else if (newTotalPaid > 0) {
        newStatus = 'partial'
    }

    if (newStatus !== invoice.status) {
        await supabase
            .from('invoices')
            .update({
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
            })
            .eq('id', validatedFields.data.invoice_id)
    }

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/invoices/${validatedFields.data.invoice_id}`)
    return { success: true, message: 'Pago registrado exitosamente' }
}

export async function deletePaymentAction(
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Get payment info before deleting
    const { data: payment } = await supabase
        .from('payments')
        .select('invoice_id, amount')
        .eq('id', paymentId)
        .single()

    if (!payment) {
        return { success: false, error: 'Pago no encontrado' }
    }

    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

    if (error) {
        return { success: false, error: error.message }
    }

    // Recalculate invoice status
    const { data: remainingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id)

    const { data: invoice } = await supabase
        .from('invoices')
        .select('total')
        .eq('id', payment.invoice_id)
        .single()

    if (invoice) {
        const totalPaid = remainingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
        let newStatus = 'sent'

        if (totalPaid >= invoice.total) {
            newStatus = 'paid'
        } else if (totalPaid > 0) {
            newStatus = 'partial'
        }

        await supabase
            .from('invoices')
            .update({
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
            })
            .eq('id', payment.invoice_id)
    }

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/invoices/${payment.invoice_id}`)
    return { success: true }
}
