'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Wrench } from 'lucide-react'

// This page simply redirects to root where the dashboard is loaded
export default function DashboardRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to root - the root page will detect auth and show dashboard
        router.replace('/')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Wrench className="w-8 h-8 text-white animate-pulse" />
                </div>
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-slate-400">Redirigiendo...</p>
            </div>
        </div>
    )
}
