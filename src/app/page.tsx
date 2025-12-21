'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Wrench } from 'lucide-react'

// Dynamic imports for code splitting
import dynamic from 'next/dynamic'

// Import Dashboard component (the actual dashboard content)
const DashboardContent = dynamic(() => import('./(dashboard)/page'), {
    loading: () => <DashboardLoading />,
})

// Import Landing page component
const LandingContent = dynamic(() => import('@/components/landing/landing-page'), {
    loading: () => <DashboardLoading />,
})

function DashboardLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                    <Wrench className="w-7 h-7 text-white animate-pulse" />
                </div>
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <p className="text-slate-500">Cargando...</p>
            </div>
        </div>
    )
}

export default function RootPage() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
        }

        checkAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setIsAuthenticated(!!session?.user)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase])

    // Loading state
    if (isAuthenticated === null) {
        return <DashboardLoading />
    }

    // Show dashboard for authenticated users, landing for guests
    if (isAuthenticated) {
        return <DashboardContent />
    }

    return <LandingContent />
}
