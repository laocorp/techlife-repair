import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/productos/[id] - Obtener un producto
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const producto = await prisma.producto.findUnique({
            where: { id },
            include: {
                imagenes: {
                    orderBy: { orden: 'asc' }
                }
            }
        })

        if (!producto) {
            return NextResponse.json(
                { error: 'Producto no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(producto)
    } catch (error) {
        console.error('Error fetching producto:', error)
        return NextResponse.json(
            { error: 'Error al obtener producto' },
            { status: 500 }
        )
    }
}

// PATCH /api/productos/[id] - Actualizar producto
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            codigo,
            codigo_barras,
            nombre,
            descripcion,
            precio_venta,
            precio_compra,
            stock,
            stock_minimo,
            categoria,
            marca,
            activo,
            imagenes
        } = body

        const updateData: any = {}

        if (codigo !== undefined) updateData.codigo = codigo
        if (codigo_barras !== undefined) updateData.codigo_barras = codigo_barras
        if (nombre !== undefined) updateData.nombre = nombre
        if (descripcion !== undefined) updateData.descripcion = descripcion
        if (precio_venta !== undefined) updateData.precio_venta = parseFloat(precio_venta)
        if (precio_compra !== undefined) updateData.precio_compra = parseFloat(precio_compra)
        if (stock !== undefined) updateData.stock = parseInt(stock)
        if (stock_minimo !== undefined) updateData.stock_minimo = parseInt(stock_minimo)
        if (categoria !== undefined) updateData.categoria = categoria
        if (marca !== undefined) updateData.marca = marca
        if (activo !== undefined) updateData.activo = activo

        if (imagenes !== undefined) {
            updateData.imagenes = {
                deleteMany: {},
                create: Array.isArray(imagenes) ? imagenes.map((url: string, index: number) => ({
                    url,
                    orden: index,
                    principal: index === 0
                })) : []
            }
        }

        const producto = await prisma.producto.update({
            where: { id },
            data: updateData,
            include: {
                imagenes: true
            }
        })

        return NextResponse.json(producto)
    } catch (error: any) {
        console.error('Error updating producto:', error)

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
            { error: 'Error al actualizar producto' },
            { status: 500 }
        )
    }
}

// DELETE /api/productos/[id] - Eliminar producto
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Soft delete - mark as inactive
        await prisma.producto.update({
            where: { id },
            data: { activo: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting producto:', error)
        return NextResponse.json(
            { error: 'Error al eliminar producto' },
            { status: 500 }
        )
    }
}
