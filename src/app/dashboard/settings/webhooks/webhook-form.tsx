'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui'
import { createWebhookAction, updateWebhookAction, getWebhookEventsAction } from '@/actions/webhooks'
import { Save, X, Check, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

interface WebhookFormProps {
    webhook?: {
        id: string
        name: string
        description?: string
        url: string
        secret: string
        events: string[]
        headers?: Record<string, string>
        is_active: boolean
    }
    isEdit?: boolean
}

export function WebhookForm({ webhook, isEdit = false }: WebhookFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [availableEvents, setAvailableEvents] = useState<any[]>([])
    const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook?.events || [])
    const [showSecret, setShowSecret] = useState(false)
    const [secret, setSecret] = useState(webhook?.secret || generateSecret())

    // Load available events
    useEffect(() => {
        console.log('🔄 Loading webhook events...')
        getWebhookEventsAction().then(result => {
            console.log('📦 getWebhookEventsAction result:', result)
            if (result.success && result.data) {
                console.log('✅ Events loaded:', result.data.length, 'events')
                setAvailableEvents(result.data)
            } else {
                console.error('❌ Failed to load events:', result.error)
            }
        }).catch(err => {
            console.error('💥 Exception loading events:', err)
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        const webhookData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            url: formData.get('url') as string,
            secret: secret,
            events: selectedEvents,
            is_active: formData.get('is_active') === 'on',
        }

        const result = isEdit && webhook
            ? await updateWebhookAction(webhook.id, webhookData)
            : await createWebhookAction(webhookData)

        if (result.success) {
            router.push('/dashboard/settings/webhooks')
            router.refresh()
        } else {
            alert(result.error)
            setLoading(false)
        }
    }

    const toggleEvent = (eventId: string) => {
        setSelectedEvents(prev =>
            prev.includes(eventId)
                ? prev.filter(e => e !== eventId)
                : [...prev, eventId]
        )
    }

    const eventsByCategory = availableEvents.reduce((acc, event) => {
        if (!acc[event.category]) acc[event.category] = []
        acc[event.category].push(event)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-foreground">
                                Nombre *
                            </label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={webhook?.name}
                                required
                                placeholder="Ej: Notificar nuevas órdenes a n8n"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium text-foreground">
                                Descripción
                            </label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={webhook?.description}
                                placeholder="Opcional: Describe para qué usas este webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="url" className="text-sm font-medium text-foreground">
                                URL del Webhook *
                            </label>
                            <Input
                                id="url"
                                name="url"
                                type="url"
                                defaultValue={webhook?.url}
                                required
                                placeholder="https://tu-instancia.n8n.cloud/webhook/..."
                            />
                            <p className="text-xs text-foreground-muted">
                                Esta es la URL que n8n te proporciona al crear un nodo Webhook
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="secret" className="text-sm font-medium text-foreground">
                                Secret Key (HMAC)
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="secret"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        type={showSecret ? 'text' : 'password'}
                                        className="pr-10 font-mono text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSecret(generateSecret())}
                                    title="Generar nuevo secret"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-foreground-muted">
                                Usa este secret en n8n para validar que los webhooks vienen de tu sistema
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                defaultChecked={webhook?.is_active ?? true}
                                className="h-4 w-4 rounded border-border"
                            />
                            <label htmlFor="is_active" className="text-sm text-foreground">
                                Webhook activo
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Events Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Eventos</CardTitle>
                        <p className="text-sm text-foreground-secondary">
                            Selecciona los eventos que dispararán este webhook
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(eventsByCategory).map(([category, events]) => (
                                <div key={category}>
                                    <h4 className="font-medium text-foreground mb-2 capitalize">
                                        {category.replace('_', ' ')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {events.map((event) => {
                                            const isSelected = selectedEvents.includes(event.id)
                                            return (
                                                <button
                                                    key={event.id}
                                                    type="button"
                                                    onClick={() => toggleEvent(event.id)}
                                                    className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left
                            ${isSelected
                                                            ? 'border-success bg-success/10 text-foreground'
                                                            : 'border-border bg-background-secondary text-foreground-muted hover:border-primary/30'
                                                        }
                          `}
                                                >
                                                    <div className={`
                            h-5 w-5 rounded flex items-center justify-center border shrink-0
                            ${isSelected ? 'border-success bg-success text-white' : 'border-border'}
                          `}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{event.name}</p>
                                                        <p className="text-xs text-foreground-muted truncate">{event.description}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedEvents.length === 0 && (
                            <p className="text-sm text-foreground-secondary text-center py-4">
                                Selecciona al menos un evento para continuar
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button type="submit" disabled={loading || selectedEvents.length === 0}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Guardando...' : (isEdit ? 'Actualizar Webhook' : 'Crear Webhook')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard/settings/webhooks')}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </form>
    )
}

function generateSecret(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
