import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { CompanyForm } from './company-form'

export const metadata = {
    title: 'Configuración de Empresa',
}

interface Tenant {
    id: string
    name: string
    slug: string
    tax_id: string | null
    phone: string | null
    address: string | null
    email: string | null
}

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Tenant | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData?.tenant_id) return null

    // Only select columns that exist - add optional ones later via migration
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

    if (error || !tenant) return null

    return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        tax_id: tenant.tax_id || null,
        phone: tenant.phone || null,
        address: tenant.address || null,
        email: tenant.email || null,
    }
}

export default async function CompanySettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const tenant = await getTenant(supabase)
    if (!tenant) redirect('/dashboard')

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Configuración
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Empresa</h1>
                <p className="text-foreground-secondary">
                    Información de tu empresa
                </p>
            </div>

            <CompanyForm tenant={tenant} />
        </div>
    )
}
