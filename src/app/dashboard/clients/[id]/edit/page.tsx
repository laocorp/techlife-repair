import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditClientForm } from './edit-form'
import type { Client } from '@/types/database'

interface EditClientPageProps {
    params: Promise<{ id: string }>
}

async function getClient(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<Client | null> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !data) {
        return null
    }

    return data as Client
}

export default async function EditClientPage({ params }: EditClientPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const client = await getClient(supabase, id)

    if (!client) {
        notFound()
    }

    return <EditClientForm client={client} />
}
