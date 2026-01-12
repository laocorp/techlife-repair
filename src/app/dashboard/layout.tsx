import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, Header } from '@/components/layout'

interface UserData {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    role: string
    tenant: {
        id: string
        name: string
        status: string
    } | null
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

    // Get user data with tenant
    const { data: userData } = await supabase
        .from('users')
        .select(`
      id,
      full_name,
      email,
      avatar_url,
      role,
      tenant:tenants (
        id,
        name,
        status
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

    return (
        <div className="min-h-screen bg-background">
            <Sidebar user={user} tenant={tenant} />

            <div className="lg:pl-64">
                <Header />

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
