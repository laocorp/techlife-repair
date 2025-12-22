'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuthStore } from '@/stores'
import { TenantProvider, useMediaQuery } from '@/hooks'
import { Loader2, Wrench } from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const { user, isAuthenticated, setLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        // Check if user is authenticated from store (persisted)
        const checkAuth = () => {
            if (!isAuthenticated || !user) {
                router.push('/login')
                return
            }

            // Check if account is active
            if (!user.activo) {
                router.push('/login?error=account_inactive')
                return
            }

            setIsLoading(false)
            setLoading(false)
        }

        // Small delay to allow hydration
        const timer = setTimeout(checkAuth, 100)
        return () => clearTimeout(timer)
    }, [isAuthenticated, user, router, setLoading])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--surface-base))]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        <p className="text-sm text-slate-500">Cargando...</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <TenantProvider>
            <div className="min-h-screen bg-[hsl(var(--surface-base))]">
                <Sidebar
                    isCollapsed={isMobile ? false : isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                    isMobile={isMobile}
                    isOpenMobile={isMobileOpen}
                    onCloseMobile={() => setIsMobileOpen(false)}
                />

                <Header
                    isSidebarCollapsed={isMobile ? true : isCollapsed}
                    onMenuClick={() => setIsMobileOpen(true)}
                />

                <motion.main
                    initial={false}
                    animate={{
                        marginLeft: isMobile ? 0 : (isCollapsed ? 64 : 240),
                        paddingTop: 56 // header-height
                    }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="min-h-screen"
                >
                    <div className="p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </motion.main>
            </div>
        </TenantProvider>
    )
}
