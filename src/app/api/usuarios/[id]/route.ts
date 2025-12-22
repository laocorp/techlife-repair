import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/usuarios/[id] - Obtener un usuario
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const usuario = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                created_at: true
            }
        })

        if (!usuario) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(usuario)
    } catch (error) {
        console.error('Error fetching usuario:', error)
        return NextResponse.json(
            { error: 'Error al obtener usuario' },
            { status: 500 }
        )
    }
}

// PATCH /api/usuarios/[id] - Actualizar usuario
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const { nombre, rol, activo } = body

        const updateData: any = {}

        if (nombre !== undefined) updateData.nombre = nombre
        if (rol !== undefined) updateData.rol = rol
        if (activo !== undefined) updateData.activo = activo

        const usuario = await prisma.usuario.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true
            }
        })

        return NextResponse.json(usuario)
    } catch (error: any) {
        console.error('Error updating usuario:', error)
        return NextResponse.json(
            { error: 'Error al actualizar usuario' },
            { status: 500 }
        )
    }
}
