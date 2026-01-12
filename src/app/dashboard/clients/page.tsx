import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, Badge } from '@/components/ui'
import { Plus, Search, Building2, Mail, Phone } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/types/database'

export const metadata = {
    title: 'Clientes',
}

async function getClients(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Client[]> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return (data || []) as Client[]
}

export default async function ClientsPage() {
    const supabase = await createClient()
    const clients = await getClients(supabase)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
                    <p className="text-foreground-secondary">
                        Gestiona tus clientes y su información
                    </p>
                </div>
                <Link href="/dashboard/clients/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                    type="text"
                    placeholder="Buscar clientes..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background-tertiary text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Clients List */}
            {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4">
                        <Building2 className="h-6 w-6 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">
                        No hay clientes
                    </h3>
                    <p className="text-foreground-secondary text-center mb-4">
                        Comienza agregando tu primer cliente
                    </p>
                    <Link href="/dashboard/clients/new">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Agregar Cliente
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <Link
                            key={client.id}
                            href={`/dashboard/clients/${client.id}`}
                            className="group block rounded-xl border border-border bg-background-tertiary p-5 transition-all hover:border-primary/30 hover:shadow-card"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                {client.tax_id && (
                                    <Badge variant="default">{client.tax_id}</Badge>
                                )}
                            </div>

                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-2">
                                {client.company_name}
                            </h3>

                            <div className="space-y-1.5 text-sm text-foreground-secondary">
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-border">
                                <span className="text-xs text-foreground-muted">
                                    Agregado {formatDate(client.created_at)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
