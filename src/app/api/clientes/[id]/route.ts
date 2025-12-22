import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/clientes/[id] - Obtener un cliente
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: {
                ordenes: {
                    select: { id: true, numero: true, estado: true },
                    take: 5,
                    orderBy: { created_at: 'desc' }
                }
            }
        })

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(cliente)
    } catch (error) {
        console.error('Error fetching cliente:', error)
        return NextResponse.json(
            { error: 'Error al obtener cliente' },
            { status: 500 }
        )
    }
}

// PATCH /api/clientes/[id] - Actualizar cliente
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            nombre,
            identificacion,
            tipo_id,
            email,
            telefono,
            direccion
        } = body

        const cliente = await prisma.cliente.update({
            where: { id },
            data: {
                nombre,
                identificacion,
                tipo_id,
                email,
                telefono,
                direccion
            }
        })

        return NextResponse.json(cliente)
    } catch (error: any) {
        console.error('Error updating cliente:', error)

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Ya existe un cliente con esa identificación' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Error al actualizar cliente' },
            { status: 500 }
        )
    }
}

// DELETE /api/clientes/[id] - Eliminar cliente
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.cliente.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting cliente:', error)
        return NextResponse.json(
            { error: 'Error al eliminar cliente' },
            { status: 500 }
        )
    }
}
