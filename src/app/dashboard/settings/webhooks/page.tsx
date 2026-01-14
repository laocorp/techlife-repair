import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, Button } from '@/components/ui'
import { Plus, Webhook } from 'lucide-react'
import Link from 'next/link'
import { WebhookList } from './webhook-list'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Webhooks - Automatización',
}

async function getWebhooks(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData) return []

    const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })

    return webhooks || []
}

async function getAvailableEvents(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: events } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

    return events || []
}

export default async function WebhooksPage() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const [webhooks, events] = await Promise.all([
        getWebhooks(supabase),
        getAvailableEvents(supabase),
    ])

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Webhooks</h1>
                    <p className="text-foreground-secondary">
                        Automatiza flujos de trabajo con n8n y otras plataformas
                    </p>
                </div>
                <Link href="/dashboard/settings/webhooks/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Webhook
                    </Button>
                </Link>
            </div>

            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Webhook className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">¿Qué son los Webhooks?</h3>
                            <p className="text-sm text-foreground-secondary mt-1">
                                Los webhooks envían notificaciones automáticas a tu URL de n8n cuando ocurren eventos importantes
                                (nueva orden, cliente registrado, factura pagada, etc.). Esto te permite automatizar WhatsApp,
                                emails, sincronización con CRM, y mucho más.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <a
                                    href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                >
                                    📚 Guía de n8n Webhooks
                                </a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Webhooks List */}
            <WebhookList webhooks={webhooks} events={events} />
        </div>
    )
}
