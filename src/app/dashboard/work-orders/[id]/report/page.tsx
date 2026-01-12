import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { ReportForm } from './report-form'

interface WorkOrder {
    id: string
    order_number: string
    device_type: string | null
    device_brand: string | null
    device_model: string | null
    problem_description: string
    client: {
        company_name: string
    }
}

async function getWorkOrder(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
        .from('work_orders')
        .select(`
      id,
      order_number,
      device_type,
      device_brand,
      device_model,
      problem_description,
      client:clients(company_name)
    `)
        .eq('id', id)
        .single()

    if (error || !data) return null

    return {
        ...data,
        client: data.client as unknown as { company_name: string }
    }
}

export default async function CreateReportPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const workOrder = await getWorkOrder(supabase, id)
    if (!workOrder) redirect('/dashboard/work-orders')

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link
                    href={`/dashboard/work-orders/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a la Orden
                </Link>
            </div>

            <ReportForm workOrder={workOrder} />
        </div>
    )
}
