'use client'

import Link from 'next/link'
import { Badge, Card, CardContent, Button } from '@/components/ui'
import { ArrowRight, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { generateTechnicalReportPDF } from '@/lib/export'

interface Report {
    id: string
    diagnosis: string | null
    work_performed: string | null
    parts_used: string | null
    recommendations: string | null
    created_at: string
    work_order: {
        id: string
        order_number: string
        device_type: string
        device_brand: string | null
        client: {
            company_name: string
        }
    }
}

interface ReportsListProps {
    reports: Report[]
}

export function ReportsList({ reports }: ReportsListProps) {
    const handlePDF = (report: Report) => {
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
        })
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
                <Card key={report.id} className="h-full">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                            <Badge variant="info">
                                {report.work_order.order_number}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePDF(report)}
                                className="h-8 w-8 p-0"
                            >
                                <FileText className="h-4 w-4" />
                            </Button>
                        </div>
                        <h3 className="font-medium text-foreground mb-1">
                            {report.work_order.device_type}
                            {report.work_order.device_brand && ` ${report.work_order.device_brand}`}
                        </h3>
                        <p className="text-sm text-foreground-secondary mb-2">
                            {report.work_order.client.company_name}
                        </p>
                        {report.diagnosis && (
                            <p className="text-xs text-foreground-muted line-clamp-2">
                                {report.diagnosis}
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-foreground-muted">
                                {formatDate(report.created_at)}
                            </p>
                            <Link
                                href={`/dashboard/work-orders/${report.work_order.id}`}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                Ver orden <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
