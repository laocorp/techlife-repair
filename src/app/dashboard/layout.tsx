import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, Header } from '@/components/layout'
import { TrialExpiredBanner } from './trial-expired-banner'

interface UserData {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    role: string
    is_super_admin: boolean
    tenant: {
        id: string
        name: string
        status: string
        subscription_status: string | null
        trial_ends_at: string | null
        plan?: {
            features: { modules?: string[] }
        } | { features: { modules?: string[] } }[]
    } | null
}

function isTrialExpired(tenant: UserData['tenant']): boolean {
    if (!tenant) return false

    // If already active subscription, not expired
    if (tenant.subscription_status === 'active') return false

    // If suspended by admin
    if (tenant.status === 'suspended') return true

    // Check trial expiration
    if (tenant.subscription_status === 'trial' && tenant.trial_ends_at) {
        return new Date(tenant.trial_ends_at) < new Date()
    }

    // Default trial: 14 days from creation if no trial_ends_at
    return false
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    // Get user data with tenant and plan
    const { data: userData } = await supabase
        .from('users')
        .select(`
      id,
      full_name,
      email,
      avatar_url,
      role,
      is_super_admin,
      tenant:tenants (
        id,
        name,
        status,
        subscription_status,
        trial_ends_at,
        plan:plans (
            features
        )
      )
    `)
        .eq('auth_user_id', authUser.id)
        .single() as { data: UserData | null }

    if (!userData) {
        redirect('/onboarding')
    }

    const user = {
        full_name: userData.full_name,
        email: userData.email,
        avatar_url: userData.avatar_url,
        role: userData.role,
    }

    const tenant = {
        name: userData.tenant?.name || 'Mi Empresa',
    }

    // Check if trial expired (Super admins bypass this)
    const trialExpired = !userData.is_super_admin && isTrialExpired(userData.tenant)
    const tenantSuspended = userData.tenant?.status === 'suspended'

    // Get available modules
    let availableModules = ['clients', 'work_orders', 'reports'] // Default fallback
    if (userData.tenant?.plan) {
        const plan = Array.isArray(userData.tenant.plan) ? userData.tenant.plan[0] : userData.tenant.plan
        if (plan && 'features' in plan && plan.features?.modules) {
            availableModules = plan.features.modules
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                user={user}
                tenant={tenant}
                availableModules={availableModules}
            />

            <div className="lg:pl-64">
                <Header />

                {(trialExpired || tenantSuspended) && (
                    <TrialExpiredBanner
                        type={tenantSuspended ? 'suspended' : 'expired'}
                    />
                )}

                <main className="p-6">
                    {(trialExpired || tenantSuspended) ? (
                        <div className="opacity-50 pointer-events-none">
                            {children}
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    )
}
