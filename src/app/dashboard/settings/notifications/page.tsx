import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { NotificationsForm } from './notifications-form'

export const metadata = {
    title: 'Notificaciones',
}

export default async function NotificationsSettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get current settings (if stored)
    const { data: userData } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('auth_user_id', user.id)
        .single()

    const currentSettings = userData?.notification_settings || {
        email_orders: true,
        email_payments: true,
        email_low_stock: true,
        email_marketing: false,
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Configuración
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Notificaciones</h1>
                <p className="text-foreground-secondary">
                    Preferencias de email y alertas
                </p>
            </div>

            <NotificationsForm settings={currentSettings} />
        </div>
    )
}
