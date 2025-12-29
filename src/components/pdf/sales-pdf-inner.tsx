'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { SalesPDF } from './sales-pdf'
import { Button } from '@/components/ui/button'
import { Printer, AlertTriangle, Loader2 } from 'lucide-react'

interface SalesPDFInnerProps {
    venta: any
    fileName: string
    className?: string
    children?: React.ReactNode
}

export function SalesPDFInner({ venta, fileName, className, children }: SalesPDFInnerProps) {
    return (
        <PDFDownloadLink
            document={<SalesPDF venta={venta} />}
            fileName={fileName}
        >
            {/* @ts-ignore */}
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
                        onClick={(e) => {
                            // e.preventDefault() // Let the link work to download
                            // Actually the PDFDownloadLink renders an anchor tag.
                            // But we are wrapping it in a Button? No, the Button is inside the render prop.
                            // `PDFDownloadLink` renders an `a` tag by default unless we use the render prop to custom render.
                            // Wait, the render prop pattern allows us to render whatever we want.
                            // But to trigger the download, we usually rely on the wrapping `a` tag `PDFDownloadLink` generates if `children` is not a function.
                            // BUT if `children` IS a function, `PDFDownloadLink` DOES NOT render the `a` tag around it?
                            // Actually, looking at docs: "If children is a function, it will called with ({ blob, url, loading, error })"
                            // And it renders what we return.
                            // BUT how does the click trigger download if we return a Button? 
                            // We need to use `url` in an anchor tag or `window.open`.
                            // Wait, typically `PDFDownloadLink` renders an `<a>` tag WRAPPING the children if children is NOT a function.
                            // If children IS a function, it relies on us? No.
                            // Let's check `pdf-download-inner.tsx` implementation again.
                            // It returns a `<Button>` inside the render prop.
                            // Does that button trigger download? 
                            // If `PDFDownloadLink` wraps the result in an `<a>` tag, then clicking the button triggers the anchor.
                            // Let's verify standard behavior. `PDFDownloadLink` renders an `<a>` element by default.
                            // So the Button is inside an `<a>`. That works.
                        }}
                        className={`gap-2 ${className || ''} ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Printer className="h-4 w-4" />
                                {children || 'Imprimir PDF'}
                            </>
                        )}
                    </Button>
                )
            }}
        </PDFDownloadLink>
    )
}
