import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ordenes/[id] - Obtener una orden
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const orden = await prisma.ordenServicio.findUnique({
            where: { id },
            include: {
                cliente: true,
                tecnico: {
                    select: { id: true, nombre: true, email: true }
                },
                creado_por: {
                    select: { id: true, nombre: true }
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
        console.error('Error fetching orden:', error)
        return NextResponse.json(
            { error: 'Error al obtener orden' },
            { status: 500 }
        )
    }
}

// PATCH /api/ordenes/[id] - Actualizar orden
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            estado,
            prioridad,
            diagnostico,
            solucion,
            costo_estimado,
            costo_final,
            anticipo,
            fecha_promesa,
            fecha_entrega,
            tecnico_id
        } = body

        const updateData: any = {}

        if (estado !== undefined) updateData.estado = estado
        if (prioridad !== undefined) updateData.prioridad = prioridad
        if (diagnostico !== undefined) updateData.diagnostico = diagnostico
        if (solucion !== undefined) updateData.solucion = solucion
        if (costo_estimado !== undefined) updateData.costo_estimado = parseFloat(costo_estimado)
        if (costo_final !== undefined) updateData.costo_final = parseFloat(costo_final)
        if (anticipo !== undefined) updateData.anticipo = parseFloat(anticipo)
        if (fecha_promesa !== undefined) updateData.fecha_promesa = fecha_promesa ? new Date(fecha_promesa) : null
        if (fecha_entrega !== undefined) updateData.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : null
        if (tecnico_id !== undefined) updateData.tecnico_id = tecnico_id

        const orden = await prisma.ordenServicio.update({
            where: { id },
            data: updateData,
            include: {
                cliente: true,
                tecnico: {
                    select: { id: true, nombre: true }
                }
            }
        })

        return NextResponse.json(orden)
    } catch (error) {
        console.error('Error updating orden:', error)
        return NextResponse.json(
            { error: 'Error al actualizar orden' },
            { status: 500 }
        )
    }
}

// DELETE /api/ordenes/[id] - Eliminar orden
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.ordenServicio.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting orden:', error)
        return NextResponse.json(
            { error: 'Error al eliminar orden' },
            { status: 500 }
        )
    }
}
