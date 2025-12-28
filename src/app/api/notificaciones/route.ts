
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresa_id = searchParams.get('empresa_id')
        const limit = Number(searchParams.get('limit') || '20')

        if (!empresa_id) {
            return NextResponse.json({ error: 'Empresa ID requerido' }, { status: 400 })
        }

        const notificaciones = await prisma.notificacion.findMany({
            where: {
                empresa_id
            },
            take: limit,
            orderBy: {
                created_at: 'desc'
            }
        })

        return NextResponse.json(notificaciones)

    } catch (error: any) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, marcar_todas, empresa_id } = body

        if (marcar_todas && empresa_id) {
            await prisma.notificacion.updateMany({
                where: {
                    empresa_id,
                    leida: false
                },
                data: {
                    leida: true
                }
            })
            return NextResponse.json({ success: true })
        }

        if (id) {
            await prisma.notificacion.update({
                where: { id },
                data: { leida: true }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    } catch (error: any) {
        console.error('Error updating notification:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
