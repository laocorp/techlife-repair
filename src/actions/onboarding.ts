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

    // Check if slug is available
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

    // Create tenant
    const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
            name: validatedFields.data.company_name,
            slug: validatedFields.data.slug,
            status: 'trial',
            plan_id: defaultPlan?.id || null,
            payment_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        })
        .select('id')
        .single()

    if (tenantError || !newTenant) {
        return { errors: { _form: [tenantError?.message || 'Error al crear la empresa'] } }
    }

    // Create user record linked to tenant
    const { error: userError } = await supabase
        .from('users')
        .insert({
            tenant_id: newTenant.id,
            auth_user_id: user.id,
            role: 'admin',
            full_name: validatedFields.data.full_name,
            email: user.email || '',
            phone: validatedFields.data.phone || null,
        })

    if (userError) {
        // Rollback: delete the tenant
        await supabase.from('tenants').delete().eq('id', newTenant.id)
        return { errors: { _form: [userError.message] } }
    }

    redirect('/dashboard')
}
