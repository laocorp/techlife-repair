import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const barcode = searchParams.get('barcode')

        if (!empresaId || !barcode) {
            return NextResponse.json(
                { error: 'empresa_id y barcode son requeridos' },
                { status: 400 }
            )
        }

        const producto = await prisma.producto.findFirst({
            where: {
                empresa_id: empresaId,
                codigo_barras: barcode,
                activo: true
            },
            include: {
                imagenes: {
                    where: { principal: true },
                    take: 1
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
        console.error('Error scanning product:', error)
        return NextResponse.json(
            { error: 'Error al buscar el producto' },
            { status: 500 }
        )
    }
}
