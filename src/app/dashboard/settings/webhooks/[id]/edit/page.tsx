import { createClient } from '@/lib/supabase/server'
import { WebhookForm } from '../../webhook-form'
import { redirect } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

async function getWebhook(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
    const { data } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export default async function EditWebhookPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()
    const webhook = await getWebhook(supabase, id)

    if (!webhook) {
        redirect('/dashboard/settings/webhooks')
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Editar Webhook</h1>
                <p className="text-foreground-secondary">
                    Modificar configuración de {webhook.name}
                </p>
            </div>

            <WebhookForm webhook={webhook} isEdit />
        </div>
    )
}
