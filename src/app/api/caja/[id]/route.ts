import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/caja/[id] - Cerrar caja o actualizar
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const { estado, monto_cierre } = body

        const updateData: any = {}

        if (estado !== undefined) updateData.estado = estado
        if (monto_cierre !== undefined) updateData.monto_cierre = parseFloat(monto_cierre)
        if (estado === 'cerrada') {
            updateData.fecha_cierre = new Date()
        }

        const caja = await prisma.caja.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(caja)
    } catch (error) {
        console.error('Error updating caja:', error)
        return NextResponse.json(
            { error: 'Error al actualizar caja' },
            { status: 500 }
        )
    }
}
