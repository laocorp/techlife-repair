import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkOrderForm } from './work-order-form'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Nueva Orden de Trabajo',
}

interface Client {
    id: string
    company_name: string
}

interface User {
    id: string
    full_name: string
    role: string
}

async function getClients(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Client[]> {
    const { data } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name')

    return (data || []) as Client[]
}

async function getTechnicians(supabase: Awaited<ReturnType<typeof createClient>>): Promise<User[]> {
    const { data } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('role', ['admin', 'technician'])
        .eq('is_active', true)
        .order('full_name')

    return (data || []) as User[]
}

export default async function NewWorkOrderPage({
    searchParams,
}: {
    searchParams: Promise<{ client?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const [clients, technicians] = await Promise.all([
        getClients(supabase),
        getTechnicians(supabase),
    ])

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/work-orders"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Órdenes
                </Link>
            </div>

            <WorkOrderForm
                clients={clients}
                technicians={technicians}
                defaultClientId={params.client}
            />
        </div>
    )
}
