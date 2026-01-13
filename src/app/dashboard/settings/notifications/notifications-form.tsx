'use client'

import { useActionState } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui'
import { updateNotificationsAction, type NotificationsFormState } from '@/actions/settings'
import { Bell, Check } from 'lucide-react'

interface NotificationSettings {
    email_orders: boolean
    email_payments: boolean
    email_low_stock: boolean
    email_marketing: boolean
}

interface NotificationsFormProps {
    settings: NotificationSettings
}

const initialState: NotificationsFormState = {}

const NOTIFICATION_OPTIONS = [
    {
        id: 'email_orders',
        title: 'Órdenes de Trabajo',
        description: 'Notificaciones de nuevas órdenes y cambios de estado',
    },
    {
        id: 'email_payments',
        title: 'Pagos',
        description: 'Alertas cuando se registran pagos nuevos',
    },
    {
        id: 'email_low_stock',
        title: 'Stock Bajo',
        description: 'Alertas cuando un producto tiene stock bajo',
    },
    {
        id: 'email_marketing',
        title: 'Novedades y Tips',
        description: 'Actualizaciones del producto y consejos de uso',
    },
]

export function NotificationsForm({ settings }: NotificationsFormProps) {
    const [state, formAction, isPending] = useActionState(updateNotificationsAction, initialState)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Preferencias de Email
                </CardTitle>
            </CardHeader>

            <form action={formAction}>
                <CardContent className="space-y-4">
                    {state.success && (
                        <div className="rounded-md bg-success/10 border border-success/20 p-3 text-sm text-success flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            {state.message}
                        </div>
                    )}

                    <div className="space-y-4">
                        {NOTIFICATION_OPTIONS.map((option) => (
                            <label
                                key={option.id}
                                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-background-secondary transition-colors cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    name={option.id}
                                    defaultChecked={settings[option.id as keyof NotificationSettings]}
                                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{option.title}</p>
                                    <p className="text-sm text-foreground-secondary">{option.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end">
                    <Button type="submit" loading={isPending}>
                        Guardar Preferencias
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
