// Auth Store - Manages user authentication state
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario, Empresa, UserRole } from '@/types'

interface AuthState {
    user: Usuario | null
    empresa: Empresa | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    setUser: (user: Usuario | null) => void
    setEmpresa: (empresa: Empresa | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void

    // Helpers
    hasRole: (roles: UserRole[]) => boolean
    canAccess: (module: string) => boolean
}

// Role-based access control matrix
const rolePermissions: Record<string, UserRole[]> = {
    dashboard: ['admin', 'tecnico', 'vendedor'],
    pos: ['admin', 'vendedor'],
    inventario: ['admin', 'tecnico', 'vendedor'],
    'inventario.edit': ['admin'],
    caja: ['admin', 'vendedor'],
    ordenes: ['admin', 'tecnico', 'vendedor'],
    'ordenes.edit': ['admin', 'tecnico'],
    contabilidad: ['admin'],
    facturacion: ['admin', 'vendedor'],
    admin: ['admin'],
    'admin.usuarios': ['admin'],
    'admin.empresa': ['admin'],
    cliente: ['cliente'],
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            empresa: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            }),

            setEmpresa: (empresa) => set({ empresa }),

            setLoading: (isLoading) => set({ isLoading }),

            logout: () => set({
                user: null,
                empresa: null,
                isAuthenticated: false
            }),

            hasRole: (roles) => {
                const { user } = get()
                if (!user) return false
                return roles.includes(user.rol)
            },

            canAccess: (module) => {
                const { user } = get()
                if (!user) return false
                const allowedRoles = rolePermissions[module]
                if (!allowedRoles) return false
                return allowedRoles.includes(user.rol)
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                empresa: state.empresa
            }),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false)
            },
        }
    )
)
