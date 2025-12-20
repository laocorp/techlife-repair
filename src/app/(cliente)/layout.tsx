// src/app/(cliente)/layout.tsx
// Layout for customer portal - separate from main dashboard

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
    Wrench,
    History,
    DollarSign,
    LogOut,
    User,
    Home,
    FileText,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ClienteData {
    id: string
    nombre: string
    email: string | null
    telefono: string | null
    empresa: {
        nombre: string
    }
}

export default function ClienteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [cliente, setCliente] = useState<ClienteData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadCliente = async () => {
            try {
                // Check if user is authenticated
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push('/cliente/login')
                    return
                }

                // Get cliente data linked to this user
                const { data: clienteData, error } = await supabase
                    .from('clientes')
                    .select('id, nombre, email, telefono, empresa:empresas(nombre)')
                    .eq('user_id', user.id)
                    .single()

                if (error || !clienteData) {
                    console.error('Cliente not found')
                    router.push('/cliente/login')
                    return
                }

                setCliente(clienteData as unknown as ClienteData)
            } catch (error) {
                console.error('Auth error:', error)
                router.push('/cliente/login')
            } finally {
                setIsLoading(false)
            }
        }

        loadCliente()
    }, [supabase, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/cliente/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--surface-base))]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                        <Wrench className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--brand-accent))]" />
                        <p className="text-sm text-[hsl(var(--text-muted))]">Cargando portal...</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    const menuItems = [
        { name: 'Mis Equipos', href: '/cliente/equipos', icon: Wrench },
        { name: 'Historial', href: '/cliente/historial', icon: History },
        { name: 'Pagos', href: '/cliente/pagos', icon: DollarSign },
    ]

    return (
        <div className="min-h-screen bg-[hsl(var(--surface-base))]">
            {/* Header */}
            <header className="sticky top-0 z-50 h-14 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-elevated))]/80 backdrop-blur-xl">
                <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/cliente/equipos" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                                <Wrench className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-semibold text-[hsl(var(--text-primary))]">
                                Portal Cliente
                            </span>
                        </Link>
                        <span className="text-xs text-[hsl(var(--text-muted))] hidden sm:block">
                            {(cliente?.empresa as any)?.nombre}
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]"
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.name}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{cliente?.nombre}</p>
                            <p className="text-xs text-[hsl(var(--text-muted))]">{cliente?.email || cliente?.telefono}</p>
                        </div>
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs">
                                {cliente?.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-[hsl(var(--text-muted))] hover:text-red-400"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-elevated))]/95 backdrop-blur-xl">
                <div className="h-full flex items-center justify-around px-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-col gap-1 h-auto py-2 text-[hsl(var(--text-secondary))]"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[10px]">{item.name}</span>
                                </Button>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    )
}
