'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notificacion {
    id: string
    empresa_id: string
    usuario_id: string | null
    tipo: 'orden' | 'pago' | 'sistema' | 'completada'
    titulo: string
    mensaje: string
    leida: boolean
    link: string | null
    created_at: string
}

interface UseNotificacionesReturn {
    notificaciones: Notificacion[]
    unreadCount: number
    isLoading: boolean
    marcarLeida: (id: string) => Promise<void>
    marcarTodasLeidas: () => Promise<void>
    refetch: () => Promise<void>
}

export function useNotificaciones(): UseNotificacionesReturn {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useAuthStore()
    const supabase = createClient()

    const fetchNotificaciones = useCallback(async () => {
        if (!user?.empresa_id) {
            setNotificaciones([])
            setIsLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('empresa_id', user.empresa_id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.error('Error fetching notificaciones:', error)
                return
            }

            setNotificaciones(data || [])
        } catch (error) {
            console.error('Error fetching notificaciones:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id, supabase])

    const marcarLeida = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('id', id)

            if (error) throw error

            setNotificaciones(prev =>
                prev.map(n => n.id === id ? { ...n, leida: true } : n)
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }, [supabase])

    const marcarTodasLeidas = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('empresa_id', user.empresa_id)
                .eq('leida', false)

            if (error) throw error

            setNotificaciones(prev =>
                prev.map(n => ({ ...n, leida: true }))
            )
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }, [user?.empresa_id, supabase])

    // Initial fetch
    useEffect(() => {
        fetchNotificaciones()
    }, [fetchNotificaciones])

    // Realtime subscription
    useEffect(() => {
        if (!user?.empresa_id) return

        let channel: RealtimeChannel

        const setupRealtime = async () => {
            channel = supabase
                .channel(`notificaciones:${user.empresa_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notificaciones',
                        filter: `empresa_id=eq.${user.empresa_id}`,
                    },
                    (payload) => {
                        const newNotificacion = payload.new as Notificacion
                        setNotificaciones(prev => [newNotificacion, ...prev.slice(0, 19)])
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notificaciones',
                        filter: `empresa_id=eq.${user.empresa_id}`,
                    },
                    (payload) => {
                        const updated = payload.new as Notificacion
                        setNotificaciones(prev =>
                            prev.map(n => n.id === updated.id ? updated : n)
                        )
                    }
                )
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [user?.empresa_id, supabase])

    const unreadCount = notificaciones.filter(n => !n.leida).length

    return {
        notificaciones,
        unreadCount,
        isLoading,
        marcarLeida,
        marcarTodasLeidas,
        refetch: fetchNotificaciones,
    }
}
