import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ============ COMMON TYPES ============
interface CompanyData {
    name: string
    tax_id?: string
    phone?: string
    email?: string
    address?: string
}

// ============ PDF HEADER - MODERN DESIGN ============
function drawPDFHeader(doc: jsPDF, company: CompanyData, documentType: string, documentNumber: string) {
    const pageWidth = doc.internal.pageSize.width

    // Header background
    doc.setFillColor(17, 24, 39) // Dark bg
    doc.rect(0, 0, pageWidth, 45, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(company.name.toUpperCase(), 14, 20)

    // Company info line
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const companyInfo = [
        company.tax_id && `RUC: ${company.tax_id}`,
        company.phone && `Tel: ${company.phone}`,
        company.email,
    ].filter(Boolean).join(' • ')
    if (companyInfo) {
        doc.text(companyInfo, 14, 30)
    }
    if (company.address) {
        doc.text(company.address, 14, 38)
    }

    // Document type badge
    doc.setFillColor(59, 130, 246) // Blue accent
    doc.roundedRect(pageWidth - 75, 10, 60, 25, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(documentType, pageWidth - 45, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.text(documentNumber, pageWidth - 45, 28, { align: 'center' })

    return 55 // Y position after header
}

// ============ PDF FOOTER ============
function drawPDFFooter(doc: jsPDF, company: CompanyData) {
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // Footer line
    doc.setDrawColor(200)
    doc.line(14, pageHeight - 25, pageWidth - 14, pageHeight - 25)

    // Footer text
    doc.setTextColor(120)
    doc.setFontSize(8)
    doc.text(`${company.name} • Documento generado electrónicamente`, pageWidth / 2, pageHeight - 18, { align: 'center' })
    doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}`, pageWidth / 2, pageHeight - 12, { align: 'center' })
}

// ============ SIGNATURE AREA ============
function drawSignatureArea(doc: jsPDF, y: number) {
    const pageWidth = doc.internal.pageSize.width

    doc.setDrawColor(180)
    doc.setLineWidth(0.5)

    // Left signature
    doc.line(20, y, 85, y)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('Firma del Cliente', 52.5, y + 6, { align: 'center' })
    doc.text('C.I. ____________________', 52.5, y + 14, { align: 'center' })

    // Right signature  
    doc.line(pageWidth - 85, y, pageWidth - 20, y)
    doc.text('Firma Autorizada', pageWidth - 52.5, y + 6, { align: 'center' })
    doc.text('Sello de la Empresa', pageWidth - 52.5, y + 14, { align: 'center' })
}

// ============ INVOICE PDF ============
interface InvoiceData {
    invoice_number: string
    client_name: string
    client_address?: string
    client_tax_id?: string
    client_phone?: string
    issue_date: string
    due_date: string
    status: string
    subtotal: number
    tax_rate: number
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
    company: CompanyData
}

export function generateInvoicePDF(invoice: InvoiceData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    let y = drawPDFHeader(doc, invoice.company, 'FACTURA', invoice.invoice_number)

    // Client info box
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14, y, pageWidth - 28, 35, 3, 3, 'F')

    doc.setTextColor(100)
    doc.setFontSize(9)
    doc.text('CLIENTE', 20, y + 8)

    doc.setTextColor(0)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.client_name, 20, y + 17)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    if (invoice.client_tax_id) doc.text(`RUC/CI: ${invoice.client_tax_id}`, 20, y + 25)
    if (invoice.client_phone) doc.text(`Tel: ${invoice.client_phone}`, 20, y + 32)
    if (invoice.client_address) doc.text(invoice.client_address, 100, y + 17)

    // Dates
    doc.setTextColor(100)
    doc.setFontSize(9)
    doc.text(`Fecha: ${invoice.issue_date}`, pageWidth - 60, y + 8)
    doc.text(`Vence: ${invoice.due_date}`, pageWidth - 60, y + 16)

    const statusColors: Record<string, number[]> = {
        draft: [156, 163, 175],
        sent: [59, 130, 246],
        paid: [34, 197, 94],
        overdue: [239, 68, 68],
    }
    const statusColor = statusColors[invoice.status] || [100, 100, 100]
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    doc.roundedRect(pageWidth - 60, y + 22, 45, 10, 2, 2, 'F')
    doc.setTextColor(255)
    doc.setFontSize(8)
    doc.text(invoice.status.toUpperCase(), pageWidth - 37.5, y + 28.5, { align: 'center' })

    y += 45

    // Items table
    autoTable(doc, {
        startY: y,
        head: [['#', 'DESCRIPCIÓN', 'CANT.', 'P. UNIT.', 'DESC.', 'TOTAL']],
        body: invoice.lines.map((line, i) => [
            (i + 1).toString(),
            line.description,
            line.quantity.toFixed(2),
            `$${line.unit_price.toFixed(2)}`,
            line.discount > 0 ? `${line.discount}%` : '-',
            `$${line.total.toFixed(2)}`,
        ]),
        headStyles: {
            fillColor: [17, 24, 39],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 4,
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251],
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Totals box
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(pageWidth - 90, y, 75, 45, 3, 3, 'F')

    doc.setTextColor(80)
    doc.setFontSize(9)
    doc.text('Subtotal:', pageWidth - 85, y + 10)
    doc.text(`IVA (${invoice.tax_rate}%):`, pageWidth - 85, y + 20)

    doc.setDrawColor(200)
    doc.line(pageWidth - 85, y + 27, pageWidth - 20, y + 27)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text('TOTAL:', pageWidth - 85, y + 38)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 20, y + 10, { align: 'right' })
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, pageWidth - 20, y + 20, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 20, y + 38, { align: 'right' })

    // Notes
    if (invoice.notes) {
        doc.setTextColor(100)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text('Notas:', 14, y + 10)
        doc.text(invoice.notes, 14, y + 18)
    }

    y += 60
    drawSignatureArea(doc, y)
    drawPDFFooter(doc, invoice.company)

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
    client_address?: string
    device_type: string
    device_brand?: string
    device_model?: string
    serial_number?: string
    problem_description: string
    estimated_cost?: number
    technician_name?: string
    company: CompanyData
}

export function generateWorkOrderPDF(order: WorkOrderData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    let y = drawPDFHeader(doc, order.company, 'ORDEN', order.order_number)

    // Status and Priority badges
    const priorityColors: Record<string, number[]> = {
        low: [156, 163, 175],
        normal: [59, 130, 246],
        high: [249, 115, 22],
        urgent: [239, 68, 68],
    }
    const priorityColor = priorityColors[order.priority] || [100, 100, 100]

    doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2])
    doc.roundedRect(14, y, 40, 8, 2, 2, 'F')
    doc.setTextColor(255)
    doc.setFontSize(8)
    doc.text(order.priority.toUpperCase(), 34, y + 5.5, { align: 'center' })

    doc.setFillColor(34, 197, 94)
    doc.roundedRect(58, y, 50, 8, 2, 2, 'F')
    doc.text(order.status.toUpperCase(), 83, y + 5.5, { align: 'center' })

    doc.setTextColor(100)
    doc.setFontSize(9)
    doc.text(`Fecha: ${order.created_at}`, pageWidth - 14, y + 5, { align: 'right' })

    y += 18

    // Two-column layout
    const colWidth = (pageWidth - 38) / 2

    // Left: Client info
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14, y, colWidth, 40, 3, 3, 'F')

    doc.setTextColor(59, 130, 246)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CLIENTE', 20, y + 10)

    doc.setTextColor(0)
    doc.setFontSize(11)
    doc.text(order.client_name, 20, y + 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    if (order.client_phone) doc.text(`Tel: ${order.client_phone}`, 20, y + 28)
    if (order.client_address) doc.text(order.client_address, 20, y + 36)

    // Right: Device info
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14 + colWidth + 10, y, colWidth, 40, 3, 3, 'F')

    doc.setTextColor(59, 130, 246)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('EQUIPO', 24 + colWidth, y + 10)

    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${order.device_brand || ''} ${order.device_model || ''}`.trim() || order.device_type, 24 + colWidth, y + 20)

    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Tipo: ${order.device_type}`, 24 + colWidth, y + 28)
    if (order.serial_number) doc.text(`S/N: ${order.serial_number}`, 24 + colWidth, y + 36)

    y += 50

    // Problem description
    doc.setFillColor(254, 243, 199) // Warm yellow bg
    doc.roundedRect(14, y, pageWidth - 28, 45, 3, 3, 'F')

    doc.setTextColor(146, 64, 14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PROBLEMA REPORTADO', 20, y + 10)

    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const problemLines = doc.splitTextToSize(order.problem_description, pageWidth - 48)
    doc.text(problemLines.slice(0, 5), 20, y + 20)

    y += 55

    // Technician and Cost
    if (order.technician_name || order.estimated_cost) {
        doc.setFillColor(249, 250, 251)
        doc.roundedRect(14, y, pageWidth - 28, 20, 3, 3, 'F')

        doc.setFontSize(9)
        doc.setTextColor(80)
        if (order.technician_name) {
            doc.text('Técnico asignado:', 20, y + 8)
            doc.setTextColor(0)
            doc.setFont('helvetica', 'bold')
            doc.text(order.technician_name, 20, y + 15)
        }
        if (order.estimated_cost) {
            doc.setTextColor(80)
            doc.setFont('helvetica', 'normal')
            doc.text('Costo estimado:', pageWidth - 60, y + 8)
            doc.setTextColor(59, 130, 246)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(12)
            doc.text(`$${order.estimated_cost.toFixed(2)}`, pageWidth - 20, y + 15, { align: 'right' })
        }
        y += 30
    }

    // Terms box
    doc.setFillColor(243, 244, 246)
    doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'F')
    doc.setTextColor(100)
    doc.setFontSize(8)
    doc.text('TÉRMINOS Y CONDICIONES:', 20, y + 8)
    doc.setFontSize(7)
    doc.text('• El tiempo de reparación dependerá de la complejidad del trabajo y disponibilidad de repuestos.', 20, y + 14)
    doc.text('• No nos responsabilizamos por datos almacenados en el dispositivo.', 20, y + 19)
    doc.text('• El equipo no reclamado en 30 días pasará a inventario de la empresa.', 20, y + 24)

    y += 40
    drawSignatureArea(doc, y)
    drawPDFFooter(doc, order.company)

    doc.save(`orden-${order.order_number}.pdf`)
}

// ============ TECHNICAL REPORT PDF ============
interface TechnicalReportData {
    order_number: string
    client_name: string
    device_type: string
    device_brand?: string
    device_model?: string
    diagnosis: string
    work_performed: string
    parts_used?: string
    recommendations?: string
    created_at: string
    technician_name?: string
    company: CompanyData
}

export function generateTechnicalReportPDF(report: TechnicalReportData): void {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    let y = drawPDFHeader(doc, report.company, 'INFORME', report.order_number)

    // Info row
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(14, y, pageWidth - 28, 25, 3, 3, 'F')

    doc.setTextColor(80)
    doc.setFontSize(9)
    doc.text('Cliente:', 20, y + 8)
    doc.text('Equipo:', 80, y + 8)
    doc.text('Fecha:', pageWidth - 60, y + 8)

    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text(report.client_name, 20, y + 17)
    doc.setFont('helvetica', 'normal')
    doc.text(`${report.device_brand || ''} ${report.device_model || ''} - ${report.device_type}`, 80, y + 17)
    doc.text(report.created_at, pageWidth - 60, y + 17)

    if (report.technician_name) {
        doc.setTextColor(80)
        doc.setFontSize(8)
        doc.text(`Técnico: ${report.technician_name}`, 20, y + 22)
    }

    y += 35

    // Diagnosis section
    doc.setFillColor(254, 226, 226) // Red tint
    doc.roundedRect(14, y, pageWidth - 28, 40, 3, 3, 'F')
    doc.setTextColor(153, 27, 27)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DIAGNÓSTICO', 20, y + 10)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const diagLines = doc.splitTextToSize(report.diagnosis, pageWidth - 48)
    doc.text(diagLines.slice(0, 5), 20, y + 18)

    y += 50

    // Work performed section
    doc.setFillColor(220, 252, 231) // Green tint
    doc.roundedRect(14, y, pageWidth - 28, 40, 3, 3, 'F')
    doc.setTextColor(22, 101, 52)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TRABAJO REALIZADO', 20, y + 10)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const workLines = doc.splitTextToSize(report.work_performed, pageWidth - 48)
    doc.text(workLines.slice(0, 5), 20, y + 18)

    y += 50

    // Parts and Recommendations (two columns)
    if (report.parts_used || report.recommendations) {
        const colWidth = (pageWidth - 38) / 2

        if (report.parts_used) {
            doc.setFillColor(254, 249, 195) // Yellow tint
            doc.roundedRect(14, y, colWidth, 35, 3, 3, 'F')
            doc.setTextColor(113, 63, 18)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('REPUESTOS', 20, y + 10)
            doc.setTextColor(0)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            const partsLines = doc.splitTextToSize(report.parts_used, colWidth - 16)
            doc.text(partsLines.slice(0, 4), 20, y + 18)
        }

        if (report.recommendations) {
            doc.setFillColor(224, 231, 255) // Blue tint
            doc.roundedRect(14 + (report.parts_used ? colWidth + 10 : 0), y, colWidth, 35, 3, 3, 'F')
            doc.setTextColor(55, 48, 163)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('RECOMENDACIONES', 20 + (report.parts_used ? colWidth + 10 : 0), y + 10)
            doc.setTextColor(0)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            const recLines = doc.splitTextToSize(report.recommendations, colWidth - 16)
            doc.text(recLines.slice(0, 4), 20 + (report.parts_used ? colWidth + 10 : 0), y + 18)
        }

        y += 45
    }

    drawSignatureArea(doc, y)
    drawPDFFooter(doc, report.company)

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
