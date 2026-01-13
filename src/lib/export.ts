import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ============ INVOICE PDF ============
interface InvoiceData {
    invoice_number: string
    client_name: string
    issue_date: string
    due_date: string
    status: string
    subtotal: number
    tax_amount: number
    total: number
    lines: {
        description: string
        quantity: number
        unit_price: number
        discount: number
        total: number
    }[]
    notes?: string
}

export function generateInvoicePDF(invoice: InvoiceData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    doc.setFontSize(24)
    doc.setTextColor(59, 130, 246)
    doc.text('FACTURA', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Factura: ${invoice.invoice_number}`, 14, 40)
    doc.text(`Fecha: ${invoice.issue_date}`, 14, 46)
    doc.text(`Vencimiento: ${invoice.due_date}`, 14, 52)
    doc.text(`Estado: ${invoice.status}`, 14, 58)

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Cliente:', pageWidth - 14, 40, { align: 'right' })
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(invoice.client_name, pageWidth - 14, 48, { align: 'right' })

    autoTable(doc, {
        startY: 70,
        head: [['Descripción', 'Cant.', 'P. Unit.', 'Desc.', 'Total']],
        body: invoice.lines.map(line => [
            line.description,
            line.quantity.toString(),
            `$${line.unit_price.toFixed(2)}`,
            `${line.discount}%`,
            `$${line.total.toFixed(2)}`,
        ]),
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' },
        },
    })

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text('Subtotal:', pageWidth - 50, finalY)
    doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' })
    doc.text('IVA:', pageWidth - 50, finalY + 6)
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', pageWidth - 50, finalY + 14)
    doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 14, finalY + 14, { align: 'right' })

    if (invoice.notes) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text('Notas:', 14, finalY + 30)
        doc.setTextColor(100)
        doc.text(invoice.notes, 14, finalY + 36)
    }

    doc.save(`factura-${invoice.invoice_number}.pdf`)
}

// ============ WORK ORDER PDF ============
interface WorkOrderData {
    order_number: string
    status: string
    priority: string
    created_at: string
    client_name: string
    client_phone?: string
    device_type: string
    device_brand?: string
    device_model?: string
    serial_number?: string
    problem_description: string
    estimated_cost?: number
    technician_name?: string
}

export function generateWorkOrderPDF(order: WorkOrderData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246)
    doc.text('ORDEN DE TRABAJO', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(order.order_number, pageWidth / 2, 35, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Estado: ${order.status} | Prioridad: ${order.priority}`, pageWidth / 2, 45, { align: 'center' })

    let y = 60
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('CLIENTE', 14, y)
    y += 8
    doc.setFontSize(10)
    doc.text(order.client_name, 14, y)
    if (order.client_phone) {
        y += 6
        doc.setTextColor(100)
        doc.text(`Tel: ${order.client_phone}`, 14, y)
    }

    y += 15
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text('DISPOSITIVO', 14, y)
    y += 8
    doc.setFontSize(10)
    doc.text(`Tipo: ${order.device_type}`, 14, y)
    if (order.device_brand) { y += 6; doc.text(`Marca: ${order.device_brand}`, 14, y) }
    if (order.device_model) { y += 6; doc.text(`Modelo: ${order.device_model}`, 14, y) }
    if (order.serial_number) { y += 6; doc.text(`Serial: ${order.serial_number}`, 14, y) }

    y += 15
    doc.setFontSize(12)
    doc.text('PROBLEMA REPORTADO', 14, y)
    y += 8
    doc.setFontSize(10)
    const problemLines = doc.splitTextToSize(order.problem_description, pageWidth - 28)
    doc.text(problemLines, 14, y)
    y += problemLines.length * 5

    y += 10
    if (order.technician_name) { doc.text(`Técnico: ${order.technician_name}`, 14, y); y += 6 }
    if (order.estimated_cost) { doc.text(`Costo Estimado: $${order.estimated_cost.toFixed(2)}`, 14, y); y += 6 }
    doc.setTextColor(100)
    doc.text(`Fecha: ${order.created_at}`, 14, y)

    doc.setTextColor(0)
    doc.line(14, 250, 90, 250)
    doc.line(pageWidth - 90, 250, pageWidth - 14, 250)
    doc.setFontSize(8)
    doc.text('Firma del Cliente', 52, 255, { align: 'center' })
    doc.text('Firma del Técnico', pageWidth - 52, 255, { align: 'center' })

    doc.save(`orden-${order.order_number}.pdf`)
}

// ============ TECHNICAL REPORT PDF ============
interface TechnicalReportData {
    order_number: string
    client_name: string
    device_type: string
    device_brand?: string
    diagnosis: string
    work_performed: string
    parts_used?: string
    recommendations?: string
    created_at: string
    technician_name?: string
}

export function generateTechnicalReportPDF(report: TechnicalReportData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246)
    doc.text('INFORME TÉCNICO', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Orden: ${report.order_number}`, pageWidth / 2, 35, { align: 'center' })

    let y = 50
    doc.setFontSize(10)
    doc.text(`Cliente: ${report.client_name}`, 14, y)
    y += 6
    doc.text(`Dispositivo: ${report.device_type} ${report.device_brand || ''}`, 14, y)
    y += 6
    doc.setTextColor(100)
    doc.text(`Fecha: ${report.created_at}`, 14, y)
    if (report.technician_name) { y += 6; doc.text(`Técnico: ${report.technician_name}`, 14, y) }

    y += 15
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text('DIAGNÓSTICO', 14, y)
    y += 8
    doc.setFontSize(10)
    const diagLines = doc.splitTextToSize(report.diagnosis, pageWidth - 28)
    doc.text(diagLines, 14, y)
    y += diagLines.length * 5 + 5

    y += 10
    doc.setFontSize(12)
    doc.text('TRABAJO REALIZADO', 14, y)
    y += 8
    doc.setFontSize(10)
    const workLines = doc.splitTextToSize(report.work_performed, pageWidth - 28)
    doc.text(workLines, 14, y)
    y += workLines.length * 5 + 5

    if (report.parts_used) {
        y += 10
        doc.setFontSize(12)
        doc.text('REPUESTOS UTILIZADOS', 14, y)
        y += 8
        doc.setFontSize(10)
        const partsLines = doc.splitTextToSize(report.parts_used, pageWidth - 28)
        doc.text(partsLines, 14, y)
        y += partsLines.length * 5 + 5
    }

    if (report.recommendations) {
        y += 10
        doc.setFontSize(12)
        doc.text('RECOMENDACIONES', 14, y)
        y += 8
        doc.setFontSize(10)
        const recLines = doc.splitTextToSize(report.recommendations, pageWidth - 28)
        doc.text(recLines, 14, y)
    }

    doc.line(14, 250, 90, 250)
    doc.line(pageWidth - 90, 250, pageWidth - 14, 250)
    doc.setFontSize(8)
    doc.text('Firma del Cliente', 52, 255, { align: 'center' })
    doc.text('Firma del Técnico', pageWidth - 52, 255, { align: 'center' })

    doc.save(`informe-${report.order_number}.pdf`)
}

// ============ EXCEL EXPORTS ============
interface ReportData {
    title: string
    headers: string[]
    rows: (string | number)[][]
    totals?: (string | number)[]
}

export function generateExcelReport(data: ReportData): void {
    const worksheet = XLSX.utils.aoa_to_sheet([
        [data.title], [], data.headers, ...data.rows,
        ...(data.totals ? [[], data.totals] : []),
    ])
    worksheet['!cols'] = data.headers.map(() => ({ width: 15 }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
    XLSX.writeFile(workbook, `${data.title.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
}

export function exportInvoicesToExcel(invoices: {
    invoice_number: string; client_name: string; issue_date: string; status: string; total: number
}[]): void {
    generateExcelReport({
        title: 'Reporte de Facturas',
        headers: ['# Factura', 'Cliente', 'Fecha', 'Estado', 'Total'],
        rows: invoices.map(inv => [inv.invoice_number, inv.client_name, inv.issue_date, inv.status, `$${inv.total.toFixed(2)}`]),
        totals: ['', '', '', 'TOTAL:', `$${invoices.reduce((s, i) => s + i.total, 0).toFixed(2)}`],
    })
}
