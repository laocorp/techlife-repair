import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wrench, Phone, Mail, MapPin, Clock, Search, User } from 'lucide-react'

interface TenantPageProps {
    params: Promise<{ slug: string }>
}

async function getTenant(slug: string) {
    const supabase = await createClient()

    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

    return tenant
}

export async function generateMetadata({ params }: TenantPageProps) {
    const { slug } = await params
    const tenant = await getTenant(slug)

    if (!tenant) {
        return { title: 'No encontrado' }
    }

    return {
        title: `${tenant.name} - Servicio Técnico`,
        description: `Portal de ${tenant.name}. Rastrea tus órdenes de reparación.`
    }
}

export default async function TenantPublicPage({ params }: TenantPageProps) {
    const { slug } = await params
    const tenant = await getTenant(slug)

    if (!tenant) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased">
            {/* Header */}
            <header className="py-6 px-6">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-zinc-900" />
                        </div>
                        <div>
                            <h1 className="font-medium text-base">{tenant.name}</h1>
                            <p className="text-xs text-zinc-500">Servicio Técnico</p>
                        </div>
                    </div>

                    <Link
                        href={`/${slug}/portal`}
                        className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                    >
                        <User className="w-3.5 h-3.5" />
                        Mi cuenta
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-medium mb-4">
                        Bienvenido a {tenant.name}
                    </h2>
                    <p className="text-zinc-500 mb-8">
                        Rastrea el estado de tu reparación o accede a tu portal de cliente.
                    </p>

                    {/* Action Cards */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Link
                            href={`/${slug}/tracking`}
                            className="p-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center mb-4 transition-colors">
                                <Search className="w-5 h-5 text-zinc-400" />
                            </div>
                            <h3 className="font-medium mb-1">Rastrear Orden</h3>
                            <p className="text-xs text-zinc-500">
                                Ingresa tu número de orden para ver el estado
                            </p>
                        </Link>

                        <Link
                            href={`/${slug}/portal`}
                            className="p-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center mb-4 transition-colors">
                                <User className="w-5 h-5 text-zinc-400" />
                            </div>
                            <h3 className="font-medium mb-1">Portal de Cliente</h3>
                            <p className="text-xs text-zinc-500">
                                Accede a tu cuenta para ver todas tus órdenes
                            </p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact Info */}
            <section className="py-12 px-6">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-sm font-medium mb-6 text-center text-zinc-400">Información de Contacto</h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {tenant.phone && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50">
                                <Phone className="w-4 h-4 text-zinc-500" />
                                <div>
                                    <p className="text-xs text-zinc-500">Teléfono</p>
                                    <p className="text-sm">{tenant.phone}</p>
                                </div>
                            </div>
                        )}

                        {tenant.email && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50">
                                <Mail className="w-4 h-4 text-zinc-500" />
                                <div>
                                    <p className="text-xs text-zinc-500">Email</p>
                                    <p className="text-sm">{tenant.email}</p>
                                </div>
                            </div>
                        )}

                        {tenant.address && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50 sm:col-span-2">
                                <MapPin className="w-4 h-4 text-zinc-500" />
                                <div>
                                    <p className="text-xs text-zinc-500">Dirección</p>
                                    <p className="text-sm">{tenant.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 text-center">
                <p className="text-xs text-zinc-600">
                    Potenciado por <a href="https://repair.laocorp.lat" className="text-zinc-400 hover:text-zinc-100">TechRepair</a>
                </p>
            </footer>
        </div>
    )
}
