import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/superadmin/logs - Ver logs de actividad global
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const empresaId = searchParams.get('empresa_id')
        const modulo = searchParams.get('modulo')
        const accion = searchParams.get('accion')
        const usuarioId = searchParams.get('usuario_id')

        const skip = (page - 1) * limit

        const where: any = {}

        if (empresaId) where.empresa_id = empresaId
        if (modulo) where.modulo = modulo
        if (accion) where.accion = accion
        if (usuarioId) where.usuario_id = usuarioId

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nombre: true,
                            email: true,
                            rol: true,
                        }
                    },
                    empresa: {
                        select: {
                            id: true,
                            nombre: true,
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.activityLog.count({ where })
        ])

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        })
    } catch (error) {
        console.error('Error fetching activity logs:', error)
        return NextResponse.json(
            { error: 'Error al obtener logs de actividad' },
            { status: 500 }
        )
    }
}

// GET stats for logs
export async function getLogsStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalLogs, todayLogs, uniqueUsers, topModulos] = await Promise.all([
        prisma.activityLog.count(),
        prisma.activityLog.count({
            where: { created_at: { gte: today } }
        }),
        prisma.activityLog.groupBy({
            by: ['usuario_id'],
            _count: true,
        }),
        prisma.activityLog.groupBy({
            by: ['modulo'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        }),
    ])

    return {
        totalLogs,
        todayLogs,
        uniqueUsers: uniqueUsers.length,
        topModulos,
    }
}
