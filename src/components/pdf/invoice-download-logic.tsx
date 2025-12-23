'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoicePDF } from './invoice-pdf'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function InvoiceDownloadLogic({ facturaId, variant = 'ghost' }: { facturaId: string, variant?: 'ghost' | 'outline' | 'default' }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent row click
        setIsLoading(true)
        try {
            const res = await fetch(`/api/facturacion/${facturaId}`)
            if (!res.ok) throw new Error('Error al cargar datos')
            const fullFactura = await res.json()

            // Generate PDF
            const blob = await pdf(<InvoicePDF factura={fullFactura} empresa={fullFactura.empresa} />).toBlob()
            const url = URL.createObjectURL(blob)

            // Download
            const link = document.createElement('a')
            link.href = url
            link.download = `ORD-RIDE-${fullFactura.numero}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success('RIDE descargado')

        } catch (error) {
            console.error(error)
            toast.error('Error al descargar PDF')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={variant}
            size="icon"
            onClick={handleDownload}
            disabled={isLoading}
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            title="Descargar RIDE"
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        </Button>
    )
}
