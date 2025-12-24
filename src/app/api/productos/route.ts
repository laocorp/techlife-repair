import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/productos - Obtener productos/inventario
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const search = searchParams.get('search')
        const categoria = searchParams.get('categoria')
        const activo = searchParams.get('activo')

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
                { codigo: { contains: search, mode: 'insensitive' } },
                { codigo_barras: { contains: search, mode: 'insensitive' } },
                { marca: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (categoria) {
            where.categoria = categoria
        }

        if (activo !== null && activo !== undefined) {
            where.activo = activo === 'true'
        }

        const productos = await prisma.producto.findMany({
            where,
            include: {
                imagenes: {
                    orderBy: { orden: 'asc' }
                }
            },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(productos)
    } catch (error) {
        console.error('Error fetching productos:', error)
        return NextResponse.json(
            { error: 'Error al obtener productos' },
            { status: 500 }
        )
    }
}

// POST /api/productos - Crear nuevo producto
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            empresa_id,
            codigo,
            codigo_barras,
            nombre,
            descripcion,
            categoria,
            marca,
            precio_compra,
            precio_venta,
            stock,
            stock_minimo,
            imagenes // Array of URLs
        } = body

        if (!empresa_id || !codigo || !nombre || !precio_venta) {
            return NextResponse.json(
                { error: 'Campos requeridos faltantes' },
                { status: 400 }
            )
        }

        const producto = await prisma.producto.create({
            data: {
                empresa_id,
                codigo,
                codigo_barras,
                nombre,
                descripcion,
                categoria,
                marca,
                precio_compra: precio_compra ? parseFloat(precio_compra) : 0,
                precio_venta: parseFloat(precio_venta),
                stock: parseInt(stock) || 0,
                stock_minimo: parseInt(stock_minimo) || 5,
                imagenes: imagenes && imagenes.length > 0 ? {
                    create: imagenes.map((url: string, index: number) => ({
                        url,
                        orden: index,
                        principal: index === 0
                    }))
                } : undefined
            },
            include: {
                imagenes: true
            }
        })

        return NextResponse.json(producto, { status: 201 })
    } catch (error: any) {
        console.error('Error creating producto:', error)

        if (error.code === 'P2002') {
            const target = error.meta?.target || []
            if (target.includes('codigo')) {
                return NextResponse.json({ error: 'Ya existe un producto con ese código interno' }, { status: 409 })
            }
            if (target.includes('codigo_barras')) {
                return NextResponse.json({ error: 'Ya existe un producto con ese código de barras' }, { status: 409 })
            }
            return NextResponse.json(
                { error: 'Ya existe un producto con ese código' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Error al crear producto' },
            { status: 500 }
        )
    }
}
