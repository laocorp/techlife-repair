import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface Props {
    params: Promise<{ id: string }>
}

async function getWebhook(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
    const { data } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

async function getLogs(supabase: Awaited<ReturnType<typeof createClient>>, webhookId: string) {
    const { data } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(100)
    return data || []
}

export default async function WebhookLogsPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const [webhook, logs] = await Promise.all([
        getWebhook(supabase, id),
        getLogs(supabase, id),
    ])

    if (!webhook) {
        redirect('/dashboard/settings/webhooks')
    }

    // Calculate stats
    const total = logs.length
    const successful = logs.filter(log => log.status_code && log.status_code >= 200 && log.status_code < 300).length
    const failed = logs.filter(log => log.error || (log.status_code && (log.status_code < 200 || log.status_code >= 300))).length

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/settings/webhooks"
                    className="text-sm text-foreground-secondary hover:text-foreground flex items-center gap-2 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Webhooks
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">{webhook.name}</h1>
                <p className="text-foreground-secondary">Historial de entregas</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-foreground">{total}</p>
                            <p className="text-sm text-foreground-secondary">Total Entregas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-success">{successful}</p>
                            <p className="text-sm text-foreground-secondary">Exitosas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-2xl font-semibold text-error">{failed}</p>
                            <p className="text-sm text-foreground-secondary">Fallidas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Últimas 100 Entregas</CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="text-center text-foreground-muted py-8">
                            No hay entregas registradas aún
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => {
                                const isSuccess = log.status_code && log.status_code >= 200 && log.status_code < 300
                                const isFailed = log.error || (log.status_code && (log.status_code < 200 || log.status_code >= 300))

                                return (
                                    <div
                                        key={log.id}
                                        className="border border-border rounded-lg p-4 hover:bg-background-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant="info" className="text-xs">
                                                        {log.event_type}
                                                    </Badge>
                                                    {isSuccess && (
                                                        <div className="flex items-center gap-1 text-xs text-success">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Exitoso
                                                        </div>
                                                    )}
                                                    {isFailed && (
                                                        <div className="flex items-center gap-1 text-xs text-error">
                                                            <XCircle className="h-3 w-3" />
                                                            Fallido
                                                        </div>
                                                    )}
                                                    {!isSuccess && !isFailed && (
                                                        <div className="flex items-center gap-1 text-xs text-warning">
                                                            <Clock className="h-3 w-3" />
                                                            Pendiente
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1 text-sm">
                                                    <p className="text-foreground-muted">
                                                        <span className="font-medium">Fecha:</span> {formatDate(log.created_at)}
                                                    </p>
                                                    {log.status_code && (
                                                        <p className="text-foreground-muted">
                                                            <span className="font-medium">HTTP:</span> {log.status_code}
                                                        </p>
                                                    )}
                                                    {log.response_time_ms && (
                                                        <p className="text-foreground-muted">
                                                            <span className="font-medium">Tiempo:</span> {log.response_time_ms}ms
                                                        </p>
                                                    )}
                                                    {log.retry_count > 0 && (
                                                        <p className="text-foreground-muted">
                                                            <span className="font-medium">Reintentos:</span> {log.retry_count}
                                                        </p>
                                                    )}
                                                    {log.error && (
                                                        <p className="text-error text-xs mt-2">
                                                            <span className="font-medium">Error:</span> {log.error}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {log.response_body && (
                                                <details className="text-xs">
                                                    <summary className="cursor-pointer text-foreground-secondary hover:text-foreground">
                                                        Ver respuesta
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-background-secondary rounded text-foreground-muted overflow-auto max-w-md">
                                                        {log.response_body.substring(0, 500)}
                                                        {log.response_body.length > 500 && '...'}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
