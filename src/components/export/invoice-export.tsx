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

interface Company {
    name: string
    tax_id?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
}

interface Invoice {
    id: string
    invoice_number: string
    issue_date: string
    due_date: string | null
    status: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    notes: string | null
    client: {
        company_name: string
        phone?: string | null
        tax_id?: string | null
        address?: string | null
    }
    lines: InvoiceLine[]
    company: Company
}

interface ExportButtonsProps {
    invoice: Invoice
}

export function InvoiceExportButtons({ invoice }: ExportButtonsProps) {
    const handlePDF = () => {
        generateInvoicePDF({
            invoice_number: invoice.invoice_number,
            client_name: invoice.client.company_name,
            client_phone: invoice.client.phone || undefined,
            client_tax_id: invoice.client.tax_id || undefined,
            client_address: invoice.client.address || undefined,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date || '',
            status: invoice.status,
            subtotal: invoice.subtotal,
            tax_rate: invoice.tax_rate,
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
            company: {
                name: invoice.company.name,
                tax_id: invoice.company.tax_id || undefined,
                phone: invoice.company.phone || undefined,
                email: invoice.company.email || undefined,
                address: invoice.company.address || undefined,
            },
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
