
import { verifyPayphoneTransaction } from '@/actions/billing'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Define the correct type for searchParams in Next.js 15+ (Promise)
type Props = {
    searchParams: Promise<{ id?: string; clientTransactionId?: string; ctoken?: string }>
}

export default async function CallbackPage({ searchParams }: Props) {
    const params = await searchParams
    const { id, clientTransactionId, ctoken } = params

    let content

    if (!id || !clientTransactionId) {
        content = (
            <>
                <XCircle className="h-12 w-12 text-error mx-auto" />
                <h2 className="text-xl font-semibold">Parámetros inválidos</h2>
                <p className="text-foreground-secondary">No se pudo verificar la transacción.</p>
                <Link href="/dashboard/settings/billing">
                    <Button className="w-full">Volver</Button>
                </Link>
            </>
        )
    } else {
        // Pass ctoken if available to enable future recurring billing
        const result = await verifyPayphoneTransaction(id, clientTransactionId, ctoken)

        if (result.success) {
            content = (
                <>
                    <CheckCircle className="h-12 w-12 text-success mx-auto" />
                    <h2 className="text-xl font-semibold">¡Pago Exitoso!</h2>
                    <p className="text-foreground-secondary">{result.message}</p>
                    <Link href="/dashboard/settings/billing">
                        <Button className="w-full">Continuar</Button>
                    </Link>
                </>
            )
        } else {
            content = (
                <>
                    <XCircle className="h-12 w-12 text-error mx-auto" />
                    <h2 className="text-xl font-semibold">Pago Fallido</h2>
                    <p className="text-foreground-secondary">{result.message}</p>
                    <Link href="/dashboard/settings/billing">
                        <Button variant="outline" className="w-full">Volver a intentar</Button>
                    </Link>
                </>
            )
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center space-y-6">
                    {content}
                </CardContent>
            </Card>
        </div>
    )
}
