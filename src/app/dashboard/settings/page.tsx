import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { Settings, Building2, CreditCard, Bell, Shield, Webhook } from 'lucide-react'


export const metadata = {
    title: 'Configuración',
}

const SETTINGS_SECTIONS = [
    {
        title: 'Empresa',
        description: 'Información de tu empresa y branding',
        href: '/dashboard/settings/company',
        icon: Building2,
    },
    {
        title: 'Facturación SaaS',
        description: 'Tu plan y método de pago',
        href: '/dashboard/settings/billing',
        icon: CreditCard,
    },
    {
        title: 'Webhooks',
        description: 'Automatiza con n8n y otras plataformas',
        href: '/dashboard/settings/webhooks',
        icon: Webhook,
    },
    {
        title: 'Notificaciones',
        description: 'Preferencias de email y alertas',
        href: '/dashboard/settings/notifications',
        icon: Bell,
    },
    {
        title: 'Seguridad',
        description: 'Contraseña y autenticación',
        href: '/dashboard/settings/security',
        icon: Shield,
    },
]


export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Configuración</h1>
                <p className="text-foreground-secondary">
                    Gestiona la configuración de tu cuenta y empresa
                </p>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
                {SETTINGS_SECTIONS.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <section.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-foreground-secondary mt-1">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
