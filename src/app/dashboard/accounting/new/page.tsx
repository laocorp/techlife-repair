import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { EntryForm } from './entry-form'

export const metadata = {
    title: 'Nuevo Movimiento',
}

export default async function NewAccountingEntryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/accounting"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Contabilidad
                </Link>
            </div>

            <EntryForm />
        </div>
    )
}
