'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuthStore } from '@/stores'
import { TenantProvider, useMediaQuery } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
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

    const { user, setUser, setEmpresa, setLoading } = useAuthStore()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser()

                if (!authUser) {
                    router.push('/login')
                    return
                }

                // Get user profile with empresa
                const { data: profile, error } = await supabase
                    .from('usuarios')
                    .select('*, empresa:empresas(*)')
                    .eq('id', authUser.id)
                    .single()

                if (error || !profile) {
                    console.error('Error loading profile:', error)
                    router.push('/login')
                    return
                }

                // Check if account is active
                if (!profile.activo) {
                    router.push('/login?error=account_inactive')
                    return
                }

                // Check subscription
                if (profile.empresa && !profile.empresa.suscripcion_activa) {
                    router.push('/subscription-expired')
                    return
                }

                setUser(profile)
                setEmpresa(profile.empresa)
            } catch (error) {
                console.error('Auth error:', error)
                router.push('/login')
            } finally {
                setIsLoading(false)
                setLoading(false)
            }
        }

        loadUser()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event) => {
                if (event === 'SIGNED_OUT') {
                    router.push('/login')
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase, router, setUser, setEmpresa, setLoading])

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
