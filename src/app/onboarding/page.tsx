import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export const metadata = {
    title: 'Configurar Empresa',
}

export default async function OnboardingPage() {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user already has a tenant
    const { data: existingUser } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (existingUser) {
        redirect('/dashboard')
    }

    // Get user metadata for prefilling
    const userMetadata = user.user_metadata || {}

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                        <span className="text-xl font-bold text-primary-foreground">TR</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Configura tu Empresa
                    </h1>
                    <p className="mt-2 text-foreground-secondary">
                        Completa la información para comenzar a usar TechRepair
                    </p>
                </div>

                <OnboardingForm
                    defaultFullName={userMetadata.full_name || ''}
                    defaultEmail={user.email || ''}
                    defaultCompanyName={userMetadata.company_name || ''}
                />
            </div>
        </div>
    )
}
