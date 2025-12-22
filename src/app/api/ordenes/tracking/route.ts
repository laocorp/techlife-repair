import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ordenes/tracking - Buscar orden por número para tracking público
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const numero = searchParams.get('numero')

        if (!numero) {
            return NextResponse.json(
                { error: 'Número de orden requerido' },
                { status: 400 }
            )
        }

        const orden = await prisma.ordenServicio.findFirst({
            where: { numero: numero },
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        telefono: true,
                        email: true
                    }
                },
                empresa: {
                    select: {
                        nombre: true,
                        telefono: true
                    }
                }
            }
        })

        if (!orden) {
            return NextResponse.json(
                { error: 'Orden no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(orden)
    } catch (error) {
        console.error('Error fetching order for tracking:', error)
        return NextResponse.json(
            { error: 'Error al buscar la orden' },
            { status: 500 }
        )
    }
}
