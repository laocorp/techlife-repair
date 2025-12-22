// Multi-tenant context and hooks - using fetch API instead of Supabase
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Empresa } from '@/types'
import { useAuthStore } from '@/stores'

interface TenantContextType {
    empresa: Empresa | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
    empresa: null,
    isLoading: true,
    error: null,
    refetch: async () => { },
})

export function TenantProvider({ children }: { children: ReactNode }) {
    const [empresa, setEmpresa] = useState<Empresa | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuthStore()

    const fetchEmpresa = useCallback(async () => {
        if (!user?.empresa_id) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/empresas/${user.empresa_id}`)
            if (!response.ok) throw new Error('Error loading empresa')

            const data = await response.json()
            setEmpresa(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    useEffect(() => {
        fetchEmpresa()
    }, [fetchEmpresa])

    return (
        <TenantContext.Provider value={{ empresa, isLoading, error, refetch: fetchEmpresa }}>
            {children}
        </TenantContext.Provider>
    )
}

export function useTenant() {
    const context = useContext(TenantContext)
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider')
    }
    return context
}

// Simplified hook for tenant-scoped queries using fetch API
// Note: For complex queries, consider using specific API endpoints
export function useTenantQuery<T>(
    endpoint: string,
    options?: {
        enabled?: boolean
    }
) {
    const [data, setData] = useState<T[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuthStore()

    const fetchData = useCallback(async () => {
        if (!user?.empresa_id || options?.enabled === false) {
            setIsLoading(false)
            return
        }

        try {
            const separator = endpoint.includes('?') ? '&' : '?'
            const url = `${endpoint}${separator}empresa_id=${user.empresa_id}`

            const response = await fetch(url)
            if (!response.ok) throw new Error('Error fetching data')

            const result = await response.json()
            setData(Array.isArray(result) ? result : [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id, endpoint, options?.enabled])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, isLoading, error, refetch: fetchData }
}
