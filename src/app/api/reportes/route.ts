import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfMonth } from 'date-fns'

// GET /api/reportes - Obtener estadísticas de reportes
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const periodo = searchParams.get('periodo') || 'mes'

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        let startDate: Date
        const endDate = new Date()

        switch (periodo) {
            case 'semana':
                startDate = subDays(new Date(), 7)
                break
            case 'mes':
                startDate = startOfMonth(new Date())
                break
            case 'trimestre':
                startDate = subDays(new Date(), 90)
                break
            case 'año':
                startDate = new Date(new Date().getFullYear(), 0, 1)
                break
            default:
                startDate = startOfMonth(new Date())
        }

        // Get sales total
        const ventas = await prisma.venta.findMany({
            where: {
                empresa_id: empresaId,
                created_at: { gte: startDate }
            },
            select: { total: true }
        })
        const ventasTotal = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0)

        // Get completed orders count
        const ordenesCompletadas = await prisma.ordenServicio.count({
            where: {
                empresa_id: empresaId,
                estado: 'entregado',
                created_at: { gte: startDate }
            }
        })

        // Get pending orders count
        const ordenesPendientes = await prisma.ordenServicio.count({
            where: {
                empresa_id: empresaId,
                estado: { not: 'entregado' }
            }
        })

        // Get new clients count
        const clientesNuevos = await prisma.cliente.count({
            where: {
                empresa_id: empresaId,
                created_at: { gte: startDate }
            }
        })

        return NextResponse.json({
            ventas_total: ventasTotal,
            ordenes_completadas: ordenesCompletadas,
            ordenes_pendientes: ordenesPendientes,
            clientes_nuevos: clientesNuevos,
            productos_vendidos: 0,
            ingreso_promedio: ventas.length ? ventasTotal / ventas.length : 0
        })
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json(
            { error: 'Error al obtener reportes' },
            { status: 500 }
        )
    }
}
