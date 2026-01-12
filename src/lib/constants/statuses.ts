export const ORDER_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    open: 'Abierta',
    in_progress: 'En Proceso',
    completed: 'Completada',
    cancelled: 'Cancelada',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    open: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    completed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
}

export const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
} as const

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY]

export const PRIORITY_LABELS: Record<Priority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
    low: 'bg-slate-400',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    urgent: 'bg-red-500',
}

export const INVOICE_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    paid: 'Pagada',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
    draft: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800',
    sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    paid: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    cancelled: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800',
}

export const TENANT_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
} as const

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS]

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
    active: 'Activo',
    suspended: 'Suspendido',
    trial: 'Prueba',
}

export const SERIAL_STATUS = {
    AVAILABLE: 'available',
    ASSIGNED: 'assigned',
    SOLD: 'sold',
    DEFECTIVE: 'defective',
} as const

export type SerialStatus = (typeof SERIAL_STATUS)[keyof typeof SERIAL_STATUS]

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
    available: 'Disponible',
    assigned: 'Asignado',
    sold: 'Vendido',
    defective: 'Defectuoso',
}
