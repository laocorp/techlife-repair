// Activity Logger - Utility for logging critical actions
import { prisma } from './prisma'

export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export'

export type ActivityModule =
    | 'orders'
    | 'inventory'
    | 'clients'
    | 'users'
    | 'roles'
    | 'cash'
    | 'invoices'
    | 'sales'
    | 'settings'
    | 'auth'

interface LogActivityParams {
    empresaId: string
    usuarioId?: string | null
    accion: ActivityAction
    modulo: ActivityModule
    entidadId?: string | null
    detalles?: Record<string, unknown> | null
    ipAddress?: string | null
    userAgent?: string | null
}

/**
 * Log an activity to the database
 * Use this function to track critical actions for auditing
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                empresa_id: params.empresaId,
                usuario_id: params.usuarioId || null,
                accion: params.accion,
                modulo: params.modulo,
                entidad_id: params.entidadId || null,
                detalles: params.detalles || null,
                ip_address: params.ipAddress || null,
                user_agent: params.userAgent || null,
            },
        })
    } catch (error) {
        // Log error but don't throw - activity logging should not break the main flow
        console.error('Error logging activity:', error)
    }
}

/**
 * Get IP address from request headers
 */
export function getClientIP(request: Request): string | null {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    return null
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string | null {
    return request.headers.get('user-agent')
}

/**
 * Helper to log activity with request context
 */
export async function logActivityWithRequest(
    request: Request,
    params: Omit<LogActivityParams, 'ipAddress' | 'userAgent'>
): Promise<void> {
    await logActivity({
        ...params,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
    })
}
