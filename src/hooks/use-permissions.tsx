// Role-based access control hooks and utilities
'use client'

import { useAuthStore } from '@/stores'
import { UserRole } from '@/types'

// Permission definitions per role (legacy - fallback when role_id is not set)
// These will be used when user doesn't have a role_id assigned
const legacyRolePermissions: Record<UserRole, string[]> = {
    admin: [
        'dashboard.view',
        'dashboard.stats',
        'pos.view',
        'pos.sell',
        'pos.discount',
        'pos.void',
        'inventory.view',
        'inventory.create',
        'inventory.update',
        'inventory.delete',
        'inventory.adjust',
        'orders.view',
        'orders.create',
        'orders.update',
        'orders.delete',
        'orders.assign',
        'cash.view',
        'cash.open',
        'cash.close',
        'cash.movements',
        'clients.view',
        'clients.create',
        'clients.update',
        'clients.delete',
        'reports.view',
        'reports.export',
        'invoices.view',
        'invoices.create',
        'invoices.void',
        'settings.view',
        'settings.update',
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'roles.view',
        'roles.manage',
        'logs.view',
    ],
    tecnico: [
        'dashboard.view',
        'orders.view',
        'orders.update',
        'inventory.view',
        'clients.view',
        'reports.view',
    ],
    vendedor: [
        'dashboard.view',
        'pos.view',
        'pos.sell',
        'inventory.view',
        'cash.view',
        'cash.movements',
        'clients.view',
        'clients.create',
        'clients.update',
        'invoices.view',
        'invoices.create',
    ],
    cliente: [
        'client_portal.view',
        'client_portal.orders',
        'client_portal.history',
        'client_portal.payments',
    ],
}

// For backwards compatibility
export const rolePermissions = legacyRolePermissions

// Check if role has a specific permission (legacy system)
export function hasPermission(role: UserRole | undefined | null, permission: string): boolean {
    if (!role) return false
    return legacyRolePermissions[role]?.includes(permission) ?? false
}

// Hook to check permissions
export function usePermission(permission: string): boolean {
    const { user } = useAuthStore()
    return hasPermission(user?.rol, permission)
}

// Hook to check multiple permissions (all must be true)
export function usePermissions(permissions: string[]): boolean {
    const { user } = useAuthStore()
    return permissions.every(p => hasPermission(user?.rol, p))
}

// Hook to check if user has any of the permissions
export function useAnyPermission(permissions: string[]): boolean {
    const { user } = useAuthStore()
    return permissions.some(p => hasPermission(user?.rol, p))
}

// Hook to get all user permissions
export function useUserPermissions(): string[] {
    const { user } = useAuthStore()
    if (!user?.rol) return []
    return rolePermissions[user.rol] || []
}

// Higher-order component for role-based access
export function withPermission<P extends object>(
    permission: string,
    FallbackComponent?: React.ComponentType
) {
    return function WithPermissionWrapper(WrappedComponent: React.ComponentType<P>) {
        return function PermissionGuard(props: P) {
            const hasAccess = usePermission(permission)

            if (!hasAccess) {
                if (FallbackComponent) {
                    return <FallbackComponent />
                }
                return null
            }

            return <WrappedComponent {...props} />
        }
    }
}

// Component for conditional rendering based on permission
export function PermissionGate({
    permission,
    children,
    fallback,
}: {
    permission: string
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    const hasAccess = usePermission(permission)

    if (!hasAccess) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

// Component for role-based rendering
export function RoleGate({
    roles,
    children,
    fallback,
}: {
    roles: UserRole[]
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    const { user } = useAuthStore()
    const hasRole = user?.rol && roles.includes(user.rol)

    if (!hasRole) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        admin: 'Administrador',
        tecnico: 'Técnico',
        vendedor: 'Vendedor',
        cliente: 'Cliente',
    }
    return names[role] || role
}

// Get role badge color
export function getRoleBadgeColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        admin: 'bg-purple-500',
        tecnico: 'bg-blue-500',
        vendedor: 'bg-emerald-500',
        cliente: 'bg-slate-500',
    }
    return colors[role] || 'bg-slate-500'
}
