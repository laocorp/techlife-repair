import { WebhookForm } from '../webhook-form'

export const metadata = {
    title: 'Nuevo Webhook - Automatización',
}

export default function NewWebhookPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Crear Webhook</h1>
                <p className="text-foreground-secondary">
                    Configura un webhook para recibir notificaciones automáticas
                </p>
            </div>

            <WebhookForm />
        </div>
    )
}
