'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuthStore } from '@/stores'
import { TenantProvider, useMediaQuery } from '@/hooks'
import { Loader2, Wrench } from 'lucide-react'
import { PremiumBackground } from '@/components/ui/premium-background'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [layoutReady, setLayoutReady] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        // Wait for store to rehydrate (isAuthLoading becomes false)
        if (isAuthLoading) return

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

            setLayoutReady(true)
        }

        checkAuth()
    }, [isAuthenticated, user, isAuthLoading, router])

    if (!layoutReady) {
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
                        <p className="text-sm text-slate-500">Verificando sesión...</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <TenantProvider>
            <div className="min-h-screen relative overflow-x-hidden">
                {/* Global Premium Background */}
                <div className="fixed inset-0 z-0">
                    <PremiumBackground />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex min-h-screen">
                    <Sidebar
                        isCollapsed={isMobile ? false : isCollapsed}
                        onToggle={() => setIsCollapsed(!isCollapsed)}
                        isMobile={isMobile}
                        isOpenMobile={isMobileOpen}
                        onCloseMobile={() => setIsMobileOpen(false)}
                    />

                    <div className="flex-1 flex flex-col min-w-0">
                        <Header
                            isSidebarCollapsed={isMobile ? true : isCollapsed}
                            onMenuClick={() => setIsMobileOpen(true)}
                        />

                        <motion.main
                            initial={false}
                            animate={{
                                paddingLeft: isMobile ? 0 : (isCollapsed ? 64 : 240),
                                paddingTop: 64
                            }}
                            className="flex-1 p-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-7xl mx-auto"
                            >
                                {children}
                            </motion.div>
                        </motion.main>
                    </div>
                </div>
            </div>
        </TenantProvider>
    )
}
