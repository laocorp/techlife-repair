'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { ServiceOrderPDF } from './service-order-pdf'
import type { OrdenDataForPDF } from './pdf-download-wrapper'
import { Button } from '@/components/ui/button'
import { Download, AlertTriangle, Loader2 } from 'lucide-react'

interface PDFDownloadInnerProps {
    orden: OrdenDataForPDF
    qrCodeUrl: string
    trackingUrl: string
    fileName: string
    className?: string
    children: React.ReactNode
}

export function PDFDownloadInner({ orden, qrCodeUrl, trackingUrl, fileName, className, children }: PDFDownloadInnerProps) {
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
            {({ blob, url, loading, error }: any) => {
                if (error) {
                    console.error('PDF Generation Error:', error)
                    return (
                        <Button variant="destructive" size="sm" className={`gap-2 ${className || ''}`} disabled>
                            <AlertTriangle className="h-4 w-4" />
                            Error PDF
                        </Button>
                    )
                }

                return (
                    <Button
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className={`gap-2 ${className || ''} ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                {children}
                            </>
                        )}
                    </Button>
                )
            }}
        </PDFDownloadLink>
    )
}
