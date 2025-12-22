import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/caja/movimientos - Crear movimiento de caja
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { caja_id, tipo, concepto, monto } = body

        if (!caja_id || !tipo || !concepto || !monto) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            )
        }

        const movimiento = await prisma.cajaMovimiento.create({
            data: {
                caja_id,
                tipo,
                concepto,
                monto: parseFloat(monto)
            }
        })

        return NextResponse.json(movimiento)
    } catch (error) {
        console.error('Error creating movimiento:', error)
        return NextResponse.json(
            { error: 'Error al registrar movimiento' },
            { status: 500 }
        )
    }
}
