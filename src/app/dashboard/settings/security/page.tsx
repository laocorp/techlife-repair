import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { SecurityForm } from './security-form'

export const metadata = {
    title: 'Seguridad',
}

interface UserData {
    id: string
    full_name: string
    email: string
    phone: string | null
}

async function getUser(supabase: Awaited<ReturnType<typeof createClient>>): Promise<UserData | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('auth_user_id', authUser.id)
        .single()

    return data as UserData | null
}

export default async function SecuritySettingsPage() {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const userData = await getUser(supabase)
    if (!userData) redirect('/dashboard')

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
                <h1 className="text-2xl font-semibold text-foreground">Seguridad</h1>
                <p className="text-foreground-secondary">
                    Tu perfil y contraseña
                </p>
            </div>

            <SecurityForm user={userData} authEmail={authUser.email || ''} />
        </div>
    )
}
