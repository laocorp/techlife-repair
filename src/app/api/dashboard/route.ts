import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // Get counts in parallel
        const [
            ordenesActivas,
            ordenesCompletadas,
            ordenesHoy,
            clientesTotal,
            ventasMes,
            recentOrders,
            lowStockProducts
        ] = await Promise.all([
            // Active orders (not delivered)
            prisma.ordenServicio.count({
                where: {
                    empresa_id: empresaId,
                    estado: { not: 'entregado' }
                }
            }),

            // Completed orders
            prisma.ordenServicio.count({
                where: {
                    empresa_id: empresaId,
                    estado: 'entregado'
                }
            }),

            // Orders today
            prisma.ordenServicio.count({
                where: {
                    empresa_id: empresaId,
                    created_at: { gte: today }
                }
            }),

            // Total clients
            prisma.cliente.count({
                where: { empresa_id: empresaId }
            }),

            // Sales this month
            prisma.venta.aggregate({
                where: {
                    empresa_id: empresaId,
                    created_at: { gte: startOfMonth }
                },
                _sum: { total: true }
            }),

            // Recent orders (active)
            prisma.ordenServicio.findMany({
                where: {
                    empresa_id: empresaId,
                    estado: { not: 'entregado' }
                },
                include: {
                    cliente: {
                        select: { id: true, nombre: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 5
            }),

            // Low stock products
            prisma.producto.findMany({
                where: {
                    empresa_id: empresaId,
                    activo: true,
                },
                select: {
                    id: true,
                    nombre: true,
                    stock: true,
                    stock_minimo: true
                },
                orderBy: { stock: 'asc' },
                take: 10
            })
        ])

        // Filter low stock
        const lowStock = lowStockProducts.filter(p => p.stock <= p.stock_minimo)

        return NextResponse.json({
            stats: {
                ordenes_activas: ordenesActivas,
                ordenes_completadas: ordenesCompletadas,
                ordenes_hoy: ordenesHoy,
                ventas_hoy: 0,
                ventas_mes: Number(ventasMes._sum.total) || 0,
                clientes_total: clientesTotal,
                clientes_nuevos_mes: 0,
                productos_stock_bajo: lowStock.length
            },
            recentOrders,
            lowStock
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { error: 'Error al obtener estadísticas' },
            { status: 500 }
        )
    }
}
