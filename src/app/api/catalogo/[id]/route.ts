import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/catalogo/[id] - Actualizar marca o modelo
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { tipo, ...data } = body

        if (tipo === 'marca') {
            const marca = await prisma.marca.update({
                where: { id },
                data: {
                    nombre: data.nombre,
                    pais: data.pais || null,
                    activo: data.activo
                }
            })
            return NextResponse.json(marca)
        } else if (tipo === 'modelo') {
            const modelo = await prisma.modelo.update({
                where: { id },
                data: {
                    marca_id: data.marca_id,
                    nombre: data.nombre,
                    tipo_equipo: data.tipo_equipo,
                    activo: data.activo
                }
            })
            return NextResponse.json(modelo)
        }

        return NextResponse.json(
            { error: 'Tipo no válido' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error updating item:', error)
        return NextResponse.json(
            { error: 'Error al actualizar' },
            { status: 500 }
        )
    }
}
