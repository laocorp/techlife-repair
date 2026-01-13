import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Card } from '@/components/ui'
import { FileText } from 'lucide-react'
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
        device_model: string | null
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
                id, order_number, device_type, device_brand, device_model,
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

async function getTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single()

    if (!userData?.tenant_id) return null

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

    return tenant
}

export default async function ReportsPage() {
    const supabase = await createClient()
    const [reports, tenant] = await Promise.all([
        getReports(supabase),
        getTenant(supabase),
    ])

    const company = {
        name: tenant?.name || 'Mi Empresa',
        tax_id: tenant?.tax_id || null,
        phone: tenant?.phone || null,
        email: tenant?.email || null,
        address: tenant?.address || null,
    }

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
                <ReportsList reports={reports} company={company} />
            )}
        </div>
    )
}
