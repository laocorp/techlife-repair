import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanForm } from '../../plan-form'

export const metadata = {
    title: 'Editar Plan - Super Admin',
}

interface Props {
    params: Promise<{ id: string }>
}

async function getPlan(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
    const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single()

    return plan
}

export default async function EditPlanPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()
    const plan = await getPlan(supabase, id)

    if (!plan) {
        redirect('/dashboard/admin/plans')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Editar Plan</h2>
                <p className="text-foreground-secondary">Modificar configuración de {plan.name}</p>
            </div>

            <PlanForm plan={plan} isEdit />
        </div>
    )
}
