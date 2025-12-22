import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/catalogo - Obtener marcas y modelos
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

        const marcas = await prisma.marca.findMany({
            where: { empresa_id: empresaId },
            orderBy: { nombre: 'asc' }
        })

        const modelos = await prisma.modelo.findMany({
            where: { empresa_id: empresaId },
            include: {
                marca: { select: { nombre: true } }
            },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json({ marcas, modelos })
    } catch (error) {
        console.error('Error fetching catalogo:', error)
        return NextResponse.json(
            { error: 'Error al obtener catálogo' },
            { status: 500 }
        )
    }
}

// POST /api/catalogo - Crear marca o modelo
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tipo, empresa_id, ...data } = body

        if (tipo === 'marca') {
            const marca = await prisma.marca.create({
                data: {
                    empresa_id,
                    nombre: data.nombre,
                    pais: data.pais || null,
                    activo: true
                }
            })
            return NextResponse.json(marca)
        } else if (tipo === 'modelo') {
            const modelo = await prisma.modelo.create({
                data: {
                    empresa_id,
                    marca_id: data.marca_id,
                    nombre: data.nombre,
                    tipo_equipo: data.tipo_equipo || null,
                    activo: true
                }
            })
            return NextResponse.json(modelo)
        }

        return NextResponse.json(
            { error: 'Tipo no válido' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error creating item:', error)
        return NextResponse.json(
            { error: 'Error al crear' },
            { status: 500 }
        )
    }
}
