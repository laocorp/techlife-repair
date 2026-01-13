'use client'

import { Button } from '@/components/ui'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { generateInvoicePDF, exportInvoicesToExcel } from '@/lib/export'

interface InvoiceLine {
    description: string
    quantity: number
    unit_price: number
    discount: number
}

interface Invoice {
    id: string
    invoice_number: string
    issue_date: string
    due_date: string | null
    status: string
    subtotal: number
    tax_amount: number
    total: number
    notes: string | null
    client: {
        company_name: string
    }
    lines: InvoiceLine[]
}

interface ExportButtonsProps {
    invoice: Invoice
}

export function InvoiceExportButtons({ invoice }: ExportButtonsProps) {
    const handlePDF = () => {
        generateInvoicePDF({
            invoice_number: invoice.invoice_number,
            client_name: invoice.client.company_name,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date || '',
            status: invoice.status,
            subtotal: invoice.subtotal,
            tax_amount: invoice.tax_amount,
            total: invoice.total,
            notes: invoice.notes || undefined,
            lines: invoice.lines.map(l => ({
                description: l.description,
                quantity: l.quantity,
                unit_price: l.unit_price,
                discount: l.discount,
                total: l.quantity * l.unit_price * (1 - l.discount / 100),
            })),
        })
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePDF}>
                <FileText className="h-4 w-4" />
                PDF
            </Button>
        </div>
    )
}

interface InvoicesListExportProps {
    invoices: {
        invoice_number: string
        client_name: string
        issue_date: string
        status: string
        total: number
    }[]
}

export function InvoicesListExport({ invoices }: InvoicesListExportProps) {
    const handleExcel = () => {
        exportInvoicesToExcel(invoices)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
        </Button>
    )
}
