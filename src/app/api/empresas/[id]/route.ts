import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/empresas/[id] - Obtener una empresa
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const empresa = await prisma.empresa.findUnique({
            where: { id }
        })

        if (!empresa) {
            return NextResponse.json(
                { error: 'Empresa no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(empresa)
    } catch (error) {
        console.error('Error fetching empresa:', error)
        return NextResponse.json(
            { error: 'Error al obtener empresa' },
            { status: 500 }
        )
    }
}

// PATCH /api/empresas/[id] - Actualizar empresa
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            nombre,
            ruc,
            direccion,
            telefono,
            email,
            logo_url,
            ambiente_sri,
            establecimiento,
            punto_emision,
            plan,
            suscripcion_activa,
            fecha_vencimiento
        } = body

        const updateData: any = {}

        if (nombre !== undefined) updateData.nombre = nombre
        if (ruc !== undefined) updateData.ruc = ruc
        if (direccion !== undefined) updateData.direccion = direccion
        if (telefono !== undefined) updateData.telefono = telefono
        if (email !== undefined) updateData.email = email
        if (logo_url !== undefined) updateData.logo_url = logo_url
        if (ambiente_sri !== undefined) updateData.ambiente_sri = ambiente_sri
        if (establecimiento !== undefined) updateData.establecimiento = establecimiento
        if (punto_emision !== undefined) updateData.punto_emision = punto_emision
        if (plan !== undefined) updateData.plan = plan
        if (suscripcion_activa !== undefined) updateData.suscripcion_activa = suscripcion_activa
        if (fecha_vencimiento !== undefined) updateData.fecha_vencimiento = fecha_vencimiento ? new Date(fecha_vencimiento) : null

        const empresa = await prisma.empresa.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Error updating empresa:', error)
        return NextResponse.json(
            { error: 'Error al actualizar empresa' },
            { status: 500 }
        )
    }
}

// DELETE /api/empresas/[id] - Eliminar empresa
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.empresa.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting empresa:', error)
        return NextResponse.json(
            { error: 'Error al eliminar empresa' },
            { status: 500 }
        )
    }
}
