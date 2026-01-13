import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge, Card, CardContent } from '@/components/ui'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ReportsList } from './reports-list'

export const metadata = {
    title: 'Informes Técnicos',
}

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

async function getReports(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Report[]> {
    const { data, error } = await supabase
        .from('technical_reports')
        .select(`
            id, diagnosis, work_performed, parts_used, recommendations, created_at,
            work_order:work_orders(
                id, order_number, device_type, device_brand,
                client:clients(company_name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching reports:', error)
        return []
    }

    return (data || []).map(r => ({
        ...r,
        work_order: r.work_order as unknown as Report['work_order'],
    }))
}

export default async function ReportsPage() {
    const supabase = await createClient()
    const reports = await getReports(supabase)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Informes Técnicos</h1>
                <p className="text-foreground-secondary">
                    Los informes se crean desde las órdenes de trabajo
                </p>
            </div>

            {/* Reports List */}
            {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No hay informes</h3>
                    <p className="text-foreground-secondary text-center mb-4">
                        Crea un informe desde una orden de trabajo completada
                    </p>
                    <Link href="/dashboard/work-orders">
                        <Button variant="outline">
                            Ver Órdenes de Trabajo
                        </Button>
                    </Link>
                </div>
            ) : (
                <ReportsList reports={reports} />
            )}
        </div>
    )
}
