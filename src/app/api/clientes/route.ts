import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/clientes - Obtener clientes de la empresa
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const search = searchParams.get('search')

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        const where: any = { empresa_id: empresaId }

        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { identificacion: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { telefono: { contains: search, mode: 'insensitive' } }
            ]
        }

        const clientes = await prisma.cliente.findMany({
            where,
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(clientes)
    } catch (error) {
        console.error('Error fetching clientes:', error)
        return NextResponse.json(
            { error: 'Error al obtener clientes' },
            { status: 500 }
        )
    }
}

// POST /api/clientes - Crear nuevo cliente
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            empresa_id,
            nombre,
            identificacion,
            tipo_id,
            email,
            telefono,
            direccion
        } = body

        if (!empresa_id || !nombre) {
            return NextResponse.json(
                { error: 'empresa_id y nombre son requeridos' },
                { status: 400 }
            )
        }

        const cliente = await prisma.cliente.create({
            data: {
                empresa_id,
                nombre,
                identificacion,
                tipo_id: tipo_id || 'cedula',
                email,
                telefono,
                direccion
            }
        })

        return NextResponse.json(cliente, { status: 201 })
    } catch (error: any) {
        console.error('Error creating cliente:', error)

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Ya existe un cliente con esa identificación' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Error al crear cliente' },
            { status: 500 }
        )
    }
}
