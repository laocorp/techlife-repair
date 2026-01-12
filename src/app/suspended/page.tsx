import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'

export const metadata = {
    title: 'Cuenta Suspendida',
}

export default function SuspendedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-error-light flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-error" />
                    </div>
                    <CardTitle className="text-xl">Cuenta Suspendida</CardTitle>
                    <CardDescription>
                        Tu cuenta ha sido suspendida debido a un problema con el pago.
                    </CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                    <p className="text-sm text-foreground-secondary">
                        Para reactivar tu cuenta y recuperar el acceso a todos tus datos,
                        por favor actualiza tu método de pago.
                    </p>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                    <Link href="/dashboard/settings/billing" className="w-full">
                        <Button className="w-full">
                            Actualizar Pago
                        </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Cerrar Sesión
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
