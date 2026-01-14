import { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function checkSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('auth_user_id', user.id)
        .single()

    return data?.is_super_admin === true
}

const tabs = [
    { name: 'Empresas', href: '/dashboard/admin' },
    { name: 'Usuarios', href: '/dashboard/admin/users' },
    { name: 'Planes', href: '/dashboard/admin/plans' },
    { name: 'Pagos', href: '/dashboard/admin/payments' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()
    const isSuperAdmin = await checkSuperAdmin(supabase)

    if (!isSuperAdmin) {
        redirect('/dashboard')
    }

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="border-b border-border">
                <nav className="flex gap-6">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="pb-3 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors border-b-2 border-transparent hover:border-primary data-[active=true]:border-primary data-[active=true]:text-foreground"
                        >
                            {tab.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Page Content */}
            {children}
        </div>
    )
}
