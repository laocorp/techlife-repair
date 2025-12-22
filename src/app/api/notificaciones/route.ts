import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notificaciones - Obtener notificaciones
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const limit = parseInt(searchParams.get('limit') || '20')
        const soloNoLeidas = searchParams.get('unread') === 'true'

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        const where: any = { empresa_id: empresaId }
        if (soloNoLeidas) {
            where.leida = false
        }

        const notificaciones = await prisma.notificacion.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit
        })

        return NextResponse.json(notificaciones)
    } catch (error) {
        console.error('Error fetching notificaciones:', error)
        return NextResponse.json(
            { error: 'Error al obtener notificaciones' },
            { status: 500 }
        )
    }
}

// PATCH /api/notificaciones - Marcar como leída
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, marcar_todas, empresa_id } = body

        if (marcar_todas && empresa_id) {
            // Marcar todas como leídas
            await prisma.notificacion.updateMany({
                where: { empresa_id, leida: false },
                data: { leida: true }
            })
            return NextResponse.json({ success: true, message: 'Todas marcadas como leídas' })
        }

        if (id) {
            // Marcar una como leída
            const notificacion = await prisma.notificacion.update({
                where: { id },
                data: { leida: true }
            })
            return NextResponse.json(notificacion)
        }

        return NextResponse.json(
            { error: 'id o (marcar_todas + empresa_id) son requeridos' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error updating notificacion:', error)
        return NextResponse.json(
            { error: 'Error al actualizar notificación' },
            { status: 500 }
        )
    }
}
