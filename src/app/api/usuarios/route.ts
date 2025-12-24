import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/usuarios - Obtener usuarios (técnicos)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const rol = searchParams.get('rol')

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        const whereClause: any = {
            empresa_id: empresaId,
            activo: true
        }

        // Filter by role(s)
        if (rol) {
            const roles = rol.split(',')
            whereClause.rol = { in: roles }
        }

        const usuarios = await prisma.usuario.findMany({
            where: whereClause,
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                role_id: true,
                role: {
                    select: {
                        id: true,
                        nombre: true,
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(usuarios)
    } catch (error) {
        console.error('Error fetching usuarios:', error)
        return NextResponse.json(
            { error: 'Error al obtener usuarios' },
            { status: 500 }
        )
    }
}
