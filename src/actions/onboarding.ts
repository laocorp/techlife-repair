'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const OnboardingSchema = z.object({
    company_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().optional(),
})

export type OnboardingFormState = {
    errors?: {
        company_name?: string[]
        slug?: string[]
        full_name?: string[]
        phone?: string[]
        _form?: string[]
    }
    success?: boolean
}

export async function completeOnboarding(
    prevState: OnboardingFormState,
    formData: FormData
): Promise<OnboardingFormState> {
    const supabase = await createClient()

    // Get current auth user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { errors: { _form: ['No autorizado'] } }
    }

    // Check if user already has a tenant
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

    if (existingUser) {
        redirect('/dashboard')
    }

    // Validate form data
    const validatedFields = OnboardingSchema.safeParse({
        company_name: formData.get('company_name'),
        slug: formData.get('slug'),
        full_name: formData.get('full_name'),
        phone: formData.get('phone') || undefined,
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Check if slug is available (Pre-check for better UX, though RPC checks too)
    const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', validatedFields.data.slug)
        .single()

    if (existingTenant) {
        return { errors: { slug: ['Este slug ya está en uso'] } }
    }

    // Get default plan (Starter)
    const { data: defaultPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'Starter')
        .single()

    // Create tenant and user atomically via RPC (Bypasses RLS issues)
    const { data: result, error: rpcError } = await supabase.rpc('complete_user_onboarding', {
        p_company_name: validatedFields.data.company_name,
        p_slug: validatedFields.data.slug,
        p_full_name: validatedFields.data.full_name,
        p_phone: validatedFields.data.phone || '', // Handle optional
        p_plan_id: defaultPlan?.id || null
    })

    if (rpcError) {
        return { errors: { _form: [`Error del sistema: ${rpcError.message}`] } }
    }

    // RPC returns a JSON object, we need to cast or check it
    // The RPC returns { success: boolean, error?: string, ... }
    const response = result as { success: boolean; error?: string }

    if (!response || !response.success) {
        return { errors: { _form: [response?.error || 'Error al crear la empresa'] } }
    }

    redirect('/dashboard')
}
