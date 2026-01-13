'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EntrySchema = z.object({
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Categoría requerida'),
    amount: z.coerce.number().min(0.01, 'Monto debe ser mayor a 0'),
    description: z.string().min(1, 'Descripción requerida'),
    reference: z.string().optional(),
    entry_date: z.string(),
})

export type AccountingFormState = {
    errors?: {
        type?: string[]
        category?: string[]
        amount?: string[]
        description?: string[]
        reference?: string[]
        entry_date?: string[]
        _form?: string[]
    }
    success?: boolean
    message?: string
}

const INCOME_CATEGORIES = ['Servicios', 'Ventas', 'Reparaciones', 'Otros Ingresos']
const EXPENSE_CATEGORIES = ['Nómina', 'Alquiler', 'Servicios Básicos', 'Inventario', 'Marketing', 'Otros Gastos']

export { INCOME_CATEGORIES, EXPENSE_CATEGORIES }

export async function createAccountingEntryAction(
    prevState: AccountingFormState,
    formData: FormData
): Promise<AccountingFormState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { errors: { _form: ['No autorizado'] } }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { errors: { _form: ['Solo administradores pueden registrar movimientos'] } }
    }

    const validatedFields = EntrySchema.safeParse({
        type: formData.get('type'),
        category: formData.get('category'),
        amount: formData.get('amount'),
        description: formData.get('description'),
        reference: formData.get('reference') || undefined,
        entry_date: formData.get('entry_date'),
    })

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from('accounting_entries')
        .insert({
            tenant_id: userData.tenant_id,
            type: validatedFields.data.type,
            category: validatedFields.data.category,
            amount: validatedFields.data.amount,
            description: validatedFields.data.description,
            reference: validatedFields.data.reference || null,
            entry_date: validatedFields.data.entry_date,
        })

    if (error) {
        return { errors: { _form: [error.message] } }
    }

    revalidatePath('/dashboard/accounting')
    return { success: true, message: 'Movimiento registrado' }
}

export async function deleteAccountingEntryAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('accounting_entries')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/accounting')
    return { success: true }
}

// getAccountingSummary moved to page component
