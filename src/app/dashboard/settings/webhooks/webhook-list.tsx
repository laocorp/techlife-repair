'use client'

import { Card, CardContent, Button, Badge } from '@/components/ui'
import { Edit, Trash2, Activity, Power, Eye, TestTube } from 'lucide-react'
import { deleteWebhookAction, toggleWebhookAction, testWebhookAction } from '@/actions/webhooks'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WebhookListProps {
    webhooks: any[]
    events: any[]
}

export function WebhookList({ webhooks, events }: WebhookListProps) {
    const router = useRouter()
    const [testing, setTesting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)

    const handleTest = async (id: string) => {
        setTesting(id)
        const result = await testWebhookAction(id)
        if (result.success) {
            alert('✅ Webhook de prueba registrado\n\n' + (result.error || 'Revisa los logs para más detalles'))
        } else {
            alert(`❌ Error: ${result.error}`)
        }
        setTesting(null)
        router.refresh()
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setToggling(id)
        const result = await toggleWebhookAction(id, !currentStatus)
        if (result.success) {
            router.refresh()
        } else {
            alert(`Error: ${result.error}`)
        }
        setToggling(null)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el webhook "${name}"?\n\nEsta acción no se puede deshacer.`)) {
            return
        }

        const result = await deleteWebhookAction(id)
        if (result.success) {
            router.refresh()
        } else {
            alert(`Error: ${result.error}`)
        }
    }

    if (webhooks.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-background-secondary flex items-center justify-center mx-auto mb-4">
                        <Activity className="h-8 w-8 text-foreground-muted" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No hay webhooks configurados</h3>
                    <p className="text-sm text-foreground-secondary mb-4">
                        Crea tu primer webhook para empezar a automatizar
                    </p>
                    <Link href="/dashboard/settings/webhooks/new">
                        <Button>Crear Primer Webhook</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {webhooks.map((webhook) => (
                <Card key={webhook.id} className={!webhook.is_active ? 'opacity-60' : ''}>
                    <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                            {/* Left side - Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-foreground truncate">{webhook.name}</h3>
                                    <Badge variant={webhook.is_active ? 'success' : 'default'} className="shrink-0">
                                        {webhook.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>

                                {webhook.description && (
                                    <p className="text-sm text-foreground-secondary mb-2">{webhook.description}</p>
                                )}

                                <p className="text-xs text-foreground-muted font-mono mb-3 truncate">
                                    {webhook.url}
                                </p>

                                {/* Event badges */}
                                <div className="flex flex-wrap gap-2">
                                    {webhook.events.slice(0, 5).map((event: string) => {
                                        const eventInfo = events.find(e => e.id === event)
                                        return (
                                            <Badge key={event} variant="info" className="text-xs">
                                                {eventInfo?.name || event}
                                            </Badge>
                                        )
                                    })}
                                    {webhook.events.length > 5 && (
                                        <Badge variant="default" className="text-xs">
                                            +{webhook.events.length - 5} más
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Right side - Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Toggle active */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggle(webhook.id, webhook.is_active)}
                                    disabled={toggling === webhook.id}
                                    title={webhook.is_active ? 'Desactivar' : 'Activar'}
                                >
                                    <Power
                                        className={`h-4 w-4 ${webhook.is_active ? 'text-success' : 'text-foreground-muted'}`}
                                    />
                                </Button>

                                {/* Test */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTest(webhook.id)}
                                    disabled={testing === webhook.id || !webhook.is_active}
                                    title="Enviar evento de prueba"
                                >
                                    {testing === webhook.id ? (
                                        <span className="text-xs">...</span>
                                    ) : (
                                        <TestTube className="h-4 w-4" />
                                    )}
                                </Button>

                                {/* View logs */}
                                <Link href={`/dashboard/settings/webhooks/${webhook.id}/logs`}>
                                    <Button variant="ghost" size="sm" title="Ver historial de entregas">
                                        <Activity className="h-4 w-4" />
                                    </Button>
                                </Link>

                                {/* Edit */}
                                <Link href={`/dashboard/settings/webhooks/${webhook.id}/edit`}>
                                    <Button variant="ghost" size="sm" title="Editar">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>

                                {/* Delete */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(webhook.id, webhook.name)}
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4 text-error" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
