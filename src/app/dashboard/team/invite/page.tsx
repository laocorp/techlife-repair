import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { InviteForm } from './invite-form'

export const metadata = {
    title: 'Invitar Miembro',
}

export default async function InviteTeamMemberPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check if current user is admin
    const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

    if (!currentUser || currentUser.role !== 'admin') {
        redirect('/dashboard/team')
    }

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/team"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Equipo
                </Link>
            </div>

            <InviteForm />
        </div>
    )
}
