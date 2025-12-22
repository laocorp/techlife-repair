'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores'

export interface Notificacion {
    id: string
    empresa_id: string
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

    const fetchNotificaciones = useCallback(async () => {
        if (!user?.empresa_id) {
            setNotificaciones([])
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/notificaciones?empresa_id=${user.empresa_id}&limit=20`)

            if (!response.ok) {
                console.error('Error fetching notificaciones')
                return
            }

            const data = await response.json()
            setNotificaciones(data || [])
        } catch (error) {
            console.error('Error fetching notificaciones:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user?.empresa_id])

    const marcarLeida = useCallback(async (id: string) => {
        try {
            const response = await fetch('/api/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (!response.ok) throw new Error('Failed to mark as read')

            setNotificaciones(prev =>
                prev.map(n => n.id === id ? { ...n, leida: true } : n)
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }, [])

    const marcarTodasLeidas = useCallback(async () => {
        if (!user?.empresa_id) return

        try {
            const response = await fetch('/api/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marcar_todas: true, empresa_id: user.empresa_id })
            })

            if (!response.ok) throw new Error('Failed to mark all as read')

            setNotificaciones(prev =>
                prev.map(n => ({ ...n, leida: true }))
            )
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }, [user?.empresa_id])

    // Initial fetch
    useEffect(() => {
        fetchNotificaciones()
    }, [fetchNotificaciones])

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!user?.empresa_id) return

        const interval = setInterval(fetchNotificaciones, 30000)
        return () => clearInterval(interval)
    }, [user?.empresa_id, fetchNotificaciones])

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
