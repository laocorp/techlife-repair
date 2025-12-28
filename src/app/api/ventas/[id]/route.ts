
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        if (!id) {
            return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 })
        }

        const venta = await prisma.venta.findUnique({
            where: { id },
            include: {
                empresa: true, // Needed for invoicing (RUC, etc)
                cliente: true,
                factura: true,
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        })

        if (!venta) {
            return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
        }

        return NextResponse.json(venta)

    } catch (error: any) {
        console.error('Error fetching sale:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
