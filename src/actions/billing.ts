'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PayphoneClient } from '@/lib/payphone'
import { headers } from 'next/headers'

export async function changePlanAction(
    planId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'No autorizado' }
    }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden cambiar el plan' }
    }

    // Verify plan exists
    const { data: plan } = await supabase
        .from('plans')
        .select('id, name')
        .eq('id', planId)
        .single()

    if (!plan) {
        return { success: false, error: 'Plan no encontrado' }
    }

    // Update tenant plan
    const { error } = await supabase
        .from('tenants')
        .update({
            plan_id: planId,
        })
        .eq('id', userData.tenant_id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/billing')
    return { success: true }
}

interface UpgradeResult {
    success: boolean
    message?: string
    error?: string
    url?: string
}

export async function requestPlanUpgrade(
    planId: string,
    planName: string
): Promise<UpgradeResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden cambiar el plan' }
    }

    // Get Plan Details
    const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

    if (!plan) return { success: false, error: 'Plan no encontrado' }

    // If Free or Demo Mode (No Payphone Token)
    if (plan.price_monthly === 0 || !process.env.PAYPHONE_TOKEN) {
        const result = await changePlanAction(planId)
        if (result.success) {
            return {
                success: true,
                message: `Plan actualizado a ${planName} (Modo Demo/Gratuito)`
            }
        }
        return { success: false, error: result.error }
    }

    // Payphone Integration
    try {
        const payphone = new PayphoneClient({
            token: process.env.PAYPHONE_TOKEN,
            storeId: process.env.PAYPHONE_STORE_ID!,
        })

        const clientTransactionId = crypto.randomUUID().replace(/-/g, '').substring(0, 30)
        const amountInCents = Math.round(plan.price_monthly * 100)

        // Create Transaction Record
        const { error: dbError } = await supabase.from('transactions').insert({
            tenant_id: userData.tenant_id,
            plan_id: planId,
            amount: amountInCents,
            provider: 'payphone',
            client_transaction_id: clientTransactionId,
            status: 'pending'
        })

        if (dbError) {
            console.error('Transaction DB Error:', dbError)
            return { success: false, error: 'Error iniciando transacción' }
        }

        // Create Payphone Link using Button/Prepare API
        // Get origin for callback
        const headersList = await headers()
        const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const link = await payphone.createLink({
            amount: amountInCents,
            amountWithoutTax: amountInCents,
            currency: 'USD',
            clientTransactionId: clientTransactionId,
            reference: `Upgrade to ${planName}`,
            responseUrl: `${origin}/dashboard/settings/billing/callback`,
            cancellationUrl: `${origin}/dashboard/settings/billing`
        })

        return { success: true, url: link.url }

    } catch (e: any) {
        console.error('Payphone Error:', e)
        return { success: false, error: e.message || 'Error con la pasarela de pago' }
    }
}

export async function verifyPayphoneTransaction(
    id: string,
    clientTransactionId: string,
    ctoken?: string
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient()

    if (!process.env.PAYPHONE_TOKEN) {
        return { success: false, message: 'Payphone token not configured' }
    }

    const payphone = new PayphoneClient({
        token: process.env.PAYPHONE_TOKEN,
        storeId: process.env.PAYPHONE_STORE_ID!,
    })

    try {
        // Use Confirm API
        const confirmResponse = await payphone.confirmPayment(id, clientTransactionId)

        const status = confirmResponse.transactionStatus

        // Update transaction record
        await supabase.from('transactions')
            .update({
                status: status.toLowerCase(),
                provider_transaction_id: String(confirmResponse.transactionId),
                metadata: confirmResponse
            })
            .eq('client_transaction_id', clientTransactionId)

        if (status === 'Approved') {
            const { data: transaction } = await supabase
                .from('transactions')
                .select('plan_id, tenant_id')
                .eq('client_transaction_id', clientTransactionId)
                .single()

            if (transaction) {
                // Update Tenant with Plan and Payment Token
                await supabase
                    .from('tenants')
                    .update({
                        plan_id: transaction.plan_id,
                        subscription_status: 'active',
                        payphone_card_token: ctoken || null, // Storing the token for future charges if available
                        payphone_card_data: {
                            cardType: confirmResponse.cardType,
                            lastDigits: confirmResponse.lastDigits,
                            bin: confirmResponse.bin,
                            holder: confirmResponse.optionalParameter4
                        }
                    })
                    .eq('id', transaction.tenant_id)

                revalidatePath('/dashboard/settings/billing')
                return { success: true, message: 'Pago aprobado y plan activado' }
            } else {
                return { success: false, message: 'Error: Transacción no encontrada en sistema' }
            }
        }

        return { success: false, message: `Estado del pago: ${status}` }

    } catch (e: any) {
        console.error('Payphone Verification Error:', e)
        return { success: false, message: 'Error verificando pago' }
    }
}
