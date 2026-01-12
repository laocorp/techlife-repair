export type UserRole = 'super_admin' | 'admin' | 'technician' | 'client'

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    CLIENT: 'client',
} as const

export const PERMISSIONS = {
    // Tenants
    'tenants:read': ['super_admin'],
    'tenants:create': ['super_admin'],
    'tenants:update': ['super_admin'],
    'tenants:suspend': ['super_admin'],

    // Users
    'users:read': ['super_admin', 'admin', 'technician'],
    'users:create': ['super_admin', 'admin'],
    'users:update': ['super_admin', 'admin'],
    'users:delete': ['super_admin', 'admin'],
    'users:invite': ['admin'],

    // Clients
    'clients:read': ['super_admin', 'admin', 'technician'],
    'clients:create': ['super_admin', 'admin'],
    'clients:update': ['super_admin', 'admin'],
    'clients:delete': ['super_admin', 'admin'],

    // Work Orders
    'work_orders:read': ['super_admin', 'admin', 'technician', 'client'],
    'work_orders:create': ['super_admin', 'admin'],
    'work_orders:update': ['super_admin', 'admin', 'technician'],
    'work_orders:delete': ['super_admin', 'admin'],
    'work_orders:assign': ['super_admin', 'admin'],

    // Technical Reports
    'reports:read': ['super_admin', 'admin', 'technician', 'client'],
    'reports:create': ['super_admin', 'admin', 'technician'],
    'reports:update': ['super_admin', 'admin', 'technician'],
    'reports:delete': ['super_admin', 'admin'],
    'reports:export': ['super_admin', 'admin', 'technician'],

    // Inventory
    'inventory:read': ['super_admin', 'admin', 'technician'],
    'inventory:create': ['super_admin', 'admin'],
    'inventory:update': ['super_admin', 'admin'],
    'inventory:delete': ['super_admin', 'admin'],
    'inventory:movements': ['super_admin', 'admin'],

    // Invoices
    'invoices:read': ['super_admin', 'admin', 'client'],
    'invoices:create': ['super_admin', 'admin'],
    'invoices:update': ['super_admin', 'admin'],
    'invoices:delete': ['super_admin', 'admin'],
    'invoices:send': ['super_admin', 'admin'],

    // Payments
    'payments:read': ['super_admin', 'admin'],
    'payments:create': ['super_admin', 'admin'],
    'payments:update': ['super_admin', 'admin'],

    // Accounting
    'accounting:read': ['super_admin', 'admin'],
    'accounting:create': ['super_admin', 'admin'],
    'accounting:update': ['super_admin', 'admin'],
    'accounting:reports': ['super_admin', 'admin'],

    // Settings
    'settings:read': ['super_admin', 'admin'],
    'settings:update': ['super_admin', 'admin'],

    // Billing (SaaS)
    'billing:read': ['super_admin', 'admin'],
    'billing:update': ['super_admin', 'admin'],

    // Super Admin only
    'saas:manage': ['super_admin'],
    'saas:analytics': ['super_admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole, permission: Permission): boolean {
    const allowedRoles = PERMISSIONS[permission] as readonly string[]
    return allowedRoles?.includes(role) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission))
}

export const ROLE_LABELS: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    technician: 'Técnico',
    client: 'Cliente',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    super_admin: 'Acceso total al sistema y todas las empresas',
    admin: 'Gestión completa de la empresa',
    technician: 'Gestión de órdenes de trabajo asignadas',
    client: 'Visualización de órdenes y facturas propias',
}
