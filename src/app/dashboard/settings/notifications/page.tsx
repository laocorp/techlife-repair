import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export const metadata = {
    title: 'Notificaciones',
}

export default function NotificationsSettingsPage() {
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Próximamente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground-muted">
                        Esta sección estará disponible en la próxima actualización.
                        Podrás configurar notificaciones por email y alertas del sistema.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
