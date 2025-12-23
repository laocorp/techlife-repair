// src/app/(cliente)/layout.tsx
// Layout for customer portal - modern glass redesign

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Wrench,
    History,
    CreditCard,
    LogOut,
    Loader2,
    Menu,
    X,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PremiumBackground } from '@/components/ui/premium-background'

interface ClienteData {
    id: string
    nombre: string
    email: string | null
    telefono: string | null
    empresa_id: string
    empresa?: {
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const loadCliente = useCallback(async () => {
        try {
            // Check localStorage for cliente session
            const stored = localStorage.getItem('cliente_portal')

            if (!stored) {
                router.push('/cliente/login')
                return
            }

            const clienteData = JSON.parse(stored)

            // Optionally fetch empresa name
            if (clienteData.empresa_id) {
                try {
                    const response = await fetch(`/api/empresas/${clienteData.empresa_id}`)
                    if (response.ok) {
                        const empresa = await response.json()
                        clienteData.empresa = { nombre: empresa.nombre }
                    }
                } catch (e) {
                    // Ignore error, empresa name is optional
                }
            }

            setCliente(clienteData)
        } catch (error) {
            console.error('Auth error:', error)
            localStorage.removeItem('cliente_portal')
            router.push('/cliente/login')
        } finally {
            setIsLoading(false)
        }
    }, [router])

    useEffect(() => {
        loadCliente()
    }, [loadCliente])

    const handleLogout = () => {
        localStorage.removeItem('cliente_portal')
        router.push('/cliente/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                        <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                        <p className="text-sm text-slate-500 font-medium">Cargando portal...</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    const menuItems = [
        { name: 'Mis Equipos', href: '/cliente/equipos', icon: Wrench },
        { name: 'Historial', href: '/cliente/historial', icon: History },
        { name: 'Pagos', href: '/cliente/pagos', icon: CreditCard },
    ]

    return (
        <div className="min-h-screen relative bg-slate-50 overflow-x-hidden text-slate-900">
            <PremiumBackground />

            {/* Desktop Navbar - Floating Glass */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 hidden md:block">
                <nav className="max-w-5xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/20 rounded-2xl px-2 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-6 pl-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                                <Wrench className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-900 text-sm leading-tight">Portal Cliente</h1>
                                {cliente?.empresa && (
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                        {cliente.empresa.nombre}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2" />

                        <div className="flex items-center gap-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`gap-2 h-9 px-4 rounded-xl transition-all duration-300 ${isActive
                                                    ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                                            {item.name}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{cliente?.nombre.split(' ')[0]}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-9 h-9"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </nav>
            </header>

            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
                        <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-slate-900">Portal</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className={`text-lg font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </Link>
                                )
                            })}
                            <div className="h-px bg-slate-100 my-4" />
                            <button
                                onClick={handleLogout}
                                className="p-4 rounded-2xl flex items-center gap-4 hover:bg-red-50 text-red-500 transition-colors w-full text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <span className="text-lg font-medium">Cerrar Sesión</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 pt-24 pb-12 relative z-10 min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    )
}
