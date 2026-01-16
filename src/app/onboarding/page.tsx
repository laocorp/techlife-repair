import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import { Wrench } from 'lucide-react'

export const metadata = {
    title: 'Configurar Empresa',
}

export default async function OnboardingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: existingUser } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (existingUser) {
        redirect('/dashboard')
    }

    const userMetadata = user.user_metadata || {}

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-zinc-100 antialiased p-6">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
                        <Wrench className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h1 className="text-xl font-medium mb-2">
                        Configura tu Empresa
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Último paso para comenzar
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
