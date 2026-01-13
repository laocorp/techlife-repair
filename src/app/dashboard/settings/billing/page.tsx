import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'

export const metadata = {
    title: 'Facturación SaaS',
}

export default function BillingSettingsPage() {
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
                <h1 className="text-2xl font-semibold text-foreground">Facturación SaaS</h1>
                <p className="text-foreground-secondary">
                    Tu plan y suscripción
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        Plan Actual
                        <Badge variant="success">Trial</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground-muted">
                        Estás en el período de prueba gratuito.
                        Contacta con soporte para activar un plan de pago.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
