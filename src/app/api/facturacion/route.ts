import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/facturacion - Obtener facturas electrónicas
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

        const facturas = await prisma.facturacionElectronica.findMany({
            where: { empresa_id: empresaId },
            orderBy: { created_at: 'desc' },
            take: 50
        })

        // Get empresa info for config
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            select: {
                ruc: true,
                nombre: true,
                direccion: true,
                telefono: true,
                ambiente_sri: true,
                establecimiento: true,
                punto_emision: true
            }
        })

        return NextResponse.json({ facturas, empresa })
    } catch (error) {
        console.error('Error fetching facturas:', error)
        return NextResponse.json(
            { error: 'Error al obtener facturas' },
            { status: 500 }
        )
    }
}
