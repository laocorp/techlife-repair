// API Route: GET activity logs with filters
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/activity-logs - List activity logs with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const usuarioId = searchParams.get('usuario_id')
        const modulo = searchParams.get('modulo')
        const accion = searchParams.get('accion')
        const fechaDesde = searchParams.get('fecha_desde')
        const fechaHasta = searchParams.get('fecha_hasta')
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const offset = parseInt(searchParams.get('offset') || '0', 10)

        if (!empresaId) {
            return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
        }

        // Build where clause
        const where: Record<string, unknown> = {
            empresa_id: empresaId,
        }

        if (usuarioId) {
            where.usuario_id = usuarioId
        }

        if (modulo) {
            where.modulo = modulo
        }

        if (accion) {
            where.accion = accion
        }

        if (fechaDesde || fechaHasta) {
            where.created_at = {}
            if (fechaDesde) {
                (where.created_at as Record<string, unknown>).gte = new Date(fechaDesde)
            }
            if (fechaHasta) {
                (where.created_at as Record<string, unknown>).lte = new Date(fechaHasta)
            }
        }

        // Get total count
        const total = await prisma.activityLog.count({ where })

        // Get logs
        const logs = await prisma.activityLog.findMany({
            where,
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
            take: limit,
            skip: offset,
        })

        return NextResponse.json({
            logs,
            total,
            limit,
            offset,
            hasMore: offset + logs.length < total,
        })
    } catch (error: unknown) {
        console.error('Error fetching activity logs:', error)
        return NextResponse.json({ error: 'Error al obtener registros de actividad' }, { status: 500 })
    }
}
