import {
    LayoutDashboard,
    Users,
    Building2,
    ClipboardList,
    FileText,
    Package,
    Receipt,
    Calculator,
    Settings,
    CreditCard,
    BarChart3,
    DollarSign,
    Shield,
    Webhook,
    type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/permissions'

export interface NavItem {
    title: string
    href: string
    icon: LucideIcon
    permission?: Permission
    badge?: string
    children?: NavItem[]
}

export const DASHBOARD_NAV: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Clientes',
        href: '/dashboard/clients',
        icon: Building2,
        permission: 'clients:read',
    },
    {
        title: 'Órdenes de Trabajo',
        href: '/dashboard/work-orders',
        icon: ClipboardList,
        permission: 'work_orders:read',
    },
    {
        title: 'Informes Técnicos',
        href: '/dashboard/reports',
        icon: FileText,
        permission: 'reports:read',
    },
    {
        title: 'Inventario',
        href: '/dashboard/inventory',
        icon: Package,
        permission: 'inventory:read',
        children: [
            {
                title: 'Productos',
                href: '/dashboard/inventory/products',
                icon: Package,
            },
            {
                title: 'Categorías',
                href: '/dashboard/inventory/categories',
                icon: Package,
            },
            {
                title: 'Movimientos',
                href: '/dashboard/inventory/movements',
                icon: Package,
            },
        ],
    },
    {
        title: 'Facturación',
        href: '/dashboard/invoices',
        icon: Receipt,
        permission: 'invoices:read',
    },
    {
        title: 'Contabilidad',
        href: '/dashboard/accounting',
        icon: Calculator,
        permission: 'accounting:read',
    },
    {
        title: 'Pagos',
        href: '/dashboard/payments',
        icon: DollarSign,
        permission: 'invoices:read',
    },
    {
        title: 'Equipo',
        href: '/dashboard/team',
        icon: Users,
        permission: 'users:read',
    },
    {
        title: 'Super Admin',
        href: '/dashboard/admin',
        icon: Shield,
        permission: 'saas:manage',
    },
]

export const SETTINGS_NAV: NavItem[] = [
    {
        title: 'General',
        href: '/dashboard/settings',
        icon: Settings,
        permission: 'settings:read',
    },
    {
        title: 'Empresa',
        href: '/dashboard/settings/company',
        icon: Building2,
        permission: 'settings:read',
    },
    {
        title: 'Facturación SaaS',
        href: '/dashboard/settings/billing',
        icon: CreditCard,
        permission: 'billing:read',
    },
    {
        title: 'Webhooks',
        href: '/dashboard/settings/webhooks',
        icon: Webhook,
        permission: 'settings:read',
    },
]

export const SUPER_ADMIN_NAV: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        permission: 'saas:manage',
    },
    {
        title: 'Empresas',
        href: '/admin/tenants',
        icon: Building2,
        permission: 'saas:manage',
    },
    {
        title: 'Pagos',
        href: '/admin/payments',
        icon: CreditCard,
        permission: 'saas:manage',
    },
    {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        permission: 'saas:analytics',
    },
]
