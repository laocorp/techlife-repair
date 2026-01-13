import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { InvoiceForm } from './invoice-form'

export const metadata = {
    title: 'Nueva Factura',
}

interface Client {
    id: string
    company_name: string
}

interface WorkOrder {
    id: string
    order_number: string
    client_id: string
    final_cost: number | null
}

async function getClients(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Client[]> {
    const { data } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name')
    return (data || []) as Client[]
}

async function getWorkOrders(supabase: Awaited<ReturnType<typeof createClient>>): Promise<WorkOrder[]> {
    const { data } = await supabase
        .from('work_orders')
        .select('id, order_number, client_id, final_cost')
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(50)
    return (data || []) as WorkOrder[]
}

export default async function NewInvoicePage({
    searchParams,
}: {
    searchParams: Promise<{ work_order?: string; client?: string }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [clients, workOrders] = await Promise.all([
        getClients(supabase),
        getWorkOrders(supabase),
    ])

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/invoices"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Facturas
                </Link>
            </div>

            <InvoiceForm
                clients={clients}
                workOrders={workOrders}
                defaultWorkOrderId={params.work_order}
                defaultClientId={params.client}
            />
        </div>
    )
}
