// PDF Wrapper for Sales - only imports @react-pdf/renderer at runtime
'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SalesPDFInner = dynamic(
    () => import('./sales-pdf-inner').then(mod => mod.SalesPDFInner),
    {
        loading: () => (
            <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando PDF...
            </Button>
        ),
        ssr: false
    }
)

interface SalesPDFWrapperProps {
    venta: any
    fileName: string
    className?: string
    children?: React.ReactNode
}

export function SalesPDFWrapper({ venta, fileName, className, children }: SalesPDFWrapperProps) {
    return (
        <SalesPDFInner
            venta={venta}
            fileName={fileName}
            className={className}
        >
            {children}
        </SalesPDFInner>
    )
}
