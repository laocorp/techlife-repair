// PDF Wrapper - only imports @react-pdf/renderer at runtime
// This prevents Turbopack from analyzing the module at build time
'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Types for the order data
export interface OrdenDataForPDF {
    numero_orden: string
    equipo: string
    marca: string | null
    modelo: string | null
    serie: string | null
    accesorios: string | null
    problema: string | null
    diagnostico: string | null
    observaciones_recepcion: string | null
    estado: string
    prioridad: string
    costo_estimado: number | null
    costo_final: number | null
    created_at: string
    cliente: {
        nombre: string
        identificacion: string
        telefono: string | null
        email: string | null
        direccion: string | null
    } | null
    tecnico: {
        nombre: string
    } | null
    empresa: {
        nombre: string
        ruc: string
        direccion: string | null
        telefono: string | null
        email: string | null
    }
}

interface PDFDownloadButtonProps {
    orden: OrdenDataForPDF
    qrCodeUrl: string
    trackingUrl: string
    fileName: string
    className?: string
    children: React.ReactNode
}

// Dynamic import with no SSR - this is the key
const PDFDownloadComponent = dynamic(
    () => import('./pdf-download-inner').then(mod => mod.PDFDownloadInner),
    {
        ssr: false,
        loading: () => <Loader2 className="h-4 w-4 animate-spin" />
    }
)

export function PDFDownloadButton({ orden, qrCodeUrl, trackingUrl, fileName, className, children }: PDFDownloadButtonProps) {
    return (
        <PDFDownloadComponent
            orden={orden}
            qrCodeUrl={qrCodeUrl}
            trackingUrl={trackingUrl}
            fileName={fileName}
            className={className}
        >
            {children}
        </PDFDownloadComponent>
    )
}
