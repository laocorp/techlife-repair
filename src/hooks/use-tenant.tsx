// Multi-tenant context and hooks
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Empresa, Usuario } from '@/types'
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
    const supabase = createClient()

    const fetchEmpresa = async () => {
        if (!user?.empresa_id) {
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', user.empresa_id)
                .single()

            if (error) throw error
            setEmpresa(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpresa()
    }, [user?.empresa_id])

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

// Hook for tenant-scoped queries
export function useTenantQuery<T>(
    tableName: string,
    options?: {
        select?: string
        filters?: Record<string, any>
        orderBy?: { column: string; ascending?: boolean }
        limit?: number
    }
) {
    const [data, setData] = useState<T[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuthStore()
    const supabase = createClient()

    const fetchData = async () => {
        if (!user?.empresa_id) {
            setIsLoading(false)
            return
        }

        try {
            let query = supabase
                .from(tableName)
                .select(options?.select || '*')
                .eq('empresa_id', user.empresa_id)

            // Apply additional filters
            if (options?.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        query = query.eq(key, value)
                    }
                })
            }

            // Apply ordering
            if (options?.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? true,
                })
            }

            // Apply limit
            if (options?.limit) {
                query = query.limit(options.limit)
            }

            const { data, error } = await query

            if (error) throw error
            setData((data as T[]) || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [user?.empresa_id, tableName])

    return { data, isLoading, error, refetch: fetchData }
}
