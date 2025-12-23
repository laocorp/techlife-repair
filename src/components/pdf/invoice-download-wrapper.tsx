'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const InvoiceDownloadComponent = dynamic(
    () => import('./invoice-download-logic').then(mod => mod.InvoiceDownloadLogic),
    {
        ssr: false,
        loading: () => (
            <Button variant="ghost" size="icon" disabled className="h-8 w-8">
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
            </Button>
        )
    }
)

export function InvoiceDownloadButton({ facturaId, variant }: { facturaId: string, variant?: 'ghost' | 'outline' | 'default' }) {
    return <InvoiceDownloadComponent facturaId={facturaId} variant={variant} />
}
