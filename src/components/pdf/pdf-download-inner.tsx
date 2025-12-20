'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { ServiceOrderPDF } from './service-order-pdf'
import type { OrdenDataForPDF } from './pdf-download-wrapper'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PDFDownloadInnerProps {
    orden: OrdenDataForPDF
    qrCodeUrl: string
    trackingUrl: string
    fileName: string
    children: React.ReactNode
}

export function PDFDownloadInner({ orden, qrCodeUrl, trackingUrl, fileName, children }: PDFDownloadInnerProps) {
    return (
        <PDFDownloadLink
            document={
                <ServiceOrderPDF
                    orden={orden}
                    qrCodeUrl={qrCodeUrl}
                    trackingUrl={trackingUrl}
                />
            }
            fileName={fileName}
        >
            {/* @ts-ignore - render prop type mismatch in react-pdf types */}
            {({ blob, url, loading, error }: any) => (
                <Button disabled={loading} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    {loading ? 'Generando PDF...' : children}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
