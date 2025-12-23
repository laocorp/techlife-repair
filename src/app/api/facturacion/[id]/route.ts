import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/facturacion/[id] - Obtener factura individual con detalles
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const factura = await prisma.facturacionElectronica.findUnique({
            where: { id },
            include: {
                venta: {
                    include: {
                        detalles: {
                            include: {
                                producto: true
                            }
                        },
                        cliente: true
                    }
                },
                empresa: true
            }
        })

        if (!factura) {
            return NextResponse.json(
                { error: 'Factura no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(factura)
    } catch (error) {
        console.error('Error fetching factura detail:', error)
        return NextResponse.json(
            { error: 'Error al obtener detalles de la factura' },
            { status: 500 }
        )
    }
}
