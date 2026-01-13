'use client'

import { Button } from '@/components/ui'
import { FileText } from 'lucide-react'
import { generateWorkOrderPDF, generateTechnicalReportPDF } from '@/lib/export'

interface WorkOrder {
    order_number: string
    status: string
    priority: string
    created_at: string
    problem_description: string
    estimated_cost: number | null
    device_type: string
    device_brand: string | null
    device_model: string | null
    serial_number: string | null
    client: { company_name: string; phone?: string | null }
    technician?: { full_name: string } | null
}

interface WorkOrderExportProps {
    order: WorkOrder
}

export function WorkOrderExportButton({ order }: WorkOrderExportProps) {
    const handlePDF = () => {
        generateWorkOrderPDF({
            order_number: order.order_number,
            status: order.status,
            priority: order.priority,
            created_at: order.created_at.split('T')[0],
            client_name: order.client.company_name,
            client_phone: order.client.phone || undefined,
            device_type: order.device_type,
            device_brand: order.device_brand || undefined,
            device_model: order.device_model || undefined,
            serial_number: order.serial_number || undefined,
            problem_description: order.problem_description,
            estimated_cost: order.estimated_cost || undefined,
            technician_name: order.technician?.full_name || undefined,
        })
    }

    return (
        <Button variant="outline" size="sm" onClick={handlePDF}>
            <FileText className="h-4 w-4" />
            PDF
        </Button>
    )
}

interface TechnicalReport {
    diagnosis: string | null
    work_performed: string | null
    parts_used: string | null
    recommendations: string | null
    created_at: string
    work_order: {
        order_number: string
        device_type: string
        device_brand: string | null
        client: { company_name: string }
    }
    technician?: { full_name: string } | null
}

interface TechnicalReportExportProps {
    report: TechnicalReport
}

export function TechnicalReportExportButton({ report }: TechnicalReportExportProps) {
    const handlePDF = () => {
        generateTechnicalReportPDF({
            order_number: report.work_order.order_number,
            client_name: report.work_order.client.company_name,
            device_type: report.work_order.device_type,
            device_brand: report.work_order.device_brand || undefined,
            diagnosis: report.diagnosis || '',
            work_performed: report.work_performed || '',
            parts_used: report.parts_used || undefined,
            recommendations: report.recommendations || undefined,
            created_at: report.created_at.split('T')[0],
            technician_name: report.technician?.full_name || undefined,
        })
    }

    return (
        <Button variant="outline" size="sm" onClick={handlePDF}>
            <FileText className="h-4 w-4" />
            PDF
        </Button>
    )
}
