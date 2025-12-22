import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suscripcion - Obtener suscripción y uso
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

        // Get subscription with plan
        const suscripcion = await prisma.suscripcion.findFirst({
            where: { empresa_id: empresaId },
            include: {
                plan: true
            }
        })

        // Calculate usage
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

        const [usuarios, ordenes, productos, facturas] = await Promise.all([
            prisma.usuario.count({
                where: { empresa_id: empresaId, activo: true }
            }),
            prisma.ordenServicio.count({
                where: { empresa_id: empresaId, created_at: { gte: startOfMonth } }
            }),
            prisma.producto.count({
                where: { empresa_id: empresaId, activo: true }
            }),
            prisma.facturacionElectronica.count({
                where: { empresa_id: empresaId, created_at: { gte: startOfMonth } }
            })
        ])

        return NextResponse.json({
            suscripcion,
            usage: {
                usuarios,
                ordenes,
                productos,
                facturas
            }
        })
    } catch (error) {
        console.error('Error fetching suscripcion:', error)
        return NextResponse.json(
            { error: 'Error al obtener suscripción' },
            { status: 500 }
        )
    }
}
