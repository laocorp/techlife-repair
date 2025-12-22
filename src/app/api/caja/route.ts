import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/caja - Obtener caja activa y movimientos
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        // Get active cash register
        const cajaActiva = await prisma.caja.findFirst({
            where: {
                empresa_id: empresaId,
                estado: 'abierta'
            },
            include: {
                usuario: {
                    select: { nombre: true }
                }
            }
        })

        // Get movements for active caja
        let movimientos: any[] = []
        if (cajaActiva) {
            movimientos = await prisma.cajaMovimiento.findMany({
                where: { caja_id: cajaActiva.id },
                orderBy: { created_at: 'desc' }
            })
        }

        // Get history (last 10)
        const historial = await prisma.caja.findMany({
            where: { empresa_id: empresaId },
            include: {
                usuario: { select: { nombre: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 10
        })

        return NextResponse.json({
            cajaActiva,
            movimientos,
            historial
        })
    } catch (error) {
        console.error('Error fetching caja:', error)
        return NextResponse.json(
            { error: 'Error al obtener caja' },
            { status: 500 }
        )
    }
}

// POST /api/caja - Abrir caja
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { empresa_id, usuario_id, monto_apertura } = body

        // Check if there's already an open caja
        const existingCaja = await prisma.caja.findFirst({
            where: {
                empresa_id,
                estado: 'abierta'
            }
        })

        if (existingCaja) {
            return NextResponse.json(
                { error: 'Ya existe una caja abierta' },
                { status: 409 }
            )
        }

        const caja = await prisma.caja.create({
            data: {
                empresa_id,
                usuario_id,
                monto_apertura: parseFloat(monto_apertura),
                estado: 'abierta'
            }
        })

        return NextResponse.json(caja)
    } catch (error) {
        console.error('Error creating caja:', error)
        return NextResponse.json(
            { error: 'Error al abrir caja' },
            { status: 500 }
        )
    }
}
