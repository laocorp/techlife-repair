
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, subMonths, startOfDay, format } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Empresas y sus planes para distribución y crecimiento
        const empresas = await prisma.empresa.findMany({
            select: {
                id: true,
                created_at: true,
                plan: true,
                _count: {
                    select: {
                        usuarios: true,
                        ordenes: true,
                        ventas: true
                    }
                }
            }
        })

        // -- Empresas por Plan --
        const planCounts: Record<string, number> = {}
        empresas.forEach(e => {
            const plan = e.plan || 'trial'
            planCounts[plan] = (planCounts[plan] || 0) + 1
        })

        const empresasPorPlan = Object.entries(planCounts).map(([plan, total]) => ({
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            total
        }))

        // -- Crecimiento de Empresas (Últimos 6 meses) --
        const empresasPorMesMap: Record<string, number> = {}
        const meses = []
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(new Date(), i)
            const key = format(d, 'MMM', { locale: es })
            empresasPorMesMap[key] = 0
            meses.push(key)
        }

        // Calcular acumulado histórico hasta hace 6 meses
        let totalAcumulado = 0
        const sixMonthsAgo = subMonths(new Date(), 6)

        // Contar anteriores
        totalAcumulado = empresas.filter(e => new Date(e.created_at) < sixMonthsAgo).length

        // Llenar mapa por mes
        // Nota: Esto es un acumulado (growth chart normalmente muestra total existente)
        // O puede ser "New companies per month". El gráfico actual es AreaChart "Crecimiento", suele ser acumulativo.
        // Vamos a hacerlo acumulativo.

        const empresasPorMes = meses.map(mes => {
            // Contar cuantas se crearon en este mes específico (o antes)
            // Para simplificar, iteramos y sumamos.
            return {
                mes: mes.charAt(0).toUpperCase() + mes.slice(1),
                total: 0 // Se llenará abajo
            }
        })

        // Recalcular acumulados correctamente
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const dateRef = subMonths(now, i)
            const monthKey = format(dateRef, 'MMM', { locale: es })

            // Contar todas las empresas creadas hasta el final de ese mes
            const endOfThatMonth = new Date(dateRef.getFullYear(), dateRef.getMonth() + 1, 0)

            const count = empresas.filter(e => new Date(e.created_at) <= endOfThatMonth).length

            const index = empresasPorMes.findIndex(item => item.mes.toLowerCase() === monthKey.toLowerCase())
            if (index !== -1) {
                empresasPorMes[index].total = count
            }
        }


        // -- Top Empresas (Ya tenemos los counts) --
        const topEmpresas = empresas
            .map(e => ({
                // Necesitamos el nombre, fetch extra o incluirlo en select arriba
                id: e.id,
                ordenes: e._count.ordenes,
                ventas: e._count.ventas,
                score: e._count.ordenes + e._count.ventas
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)

        // Necesitamos nombres de las top empresas
        const topEmpresasWithNames = await Promise.all(topEmpresas.map(async (item) => {
            const emp = await prisma.empresa.findUnique({
                where: { id: item.id },
                select: { nombre: true }
            })
            return {
                nombre: emp?.nombre || 'Desconocida',
                ordenes: item.ordenes,
                ventas: item.ventas
            }
        }))


        // -- Actividad Diaria (Últimos 7 días) --
        // Consultar ActivityLogs reales
        const sevenDaysAgo = subDays(new Date(), 7)
        const logs = await prisma.activityLog.findMany({
            where: {
                created_at: { gte: sevenDaysAgo }
            },
            select: { created_at: true }
        })

        const actividadMap: Record<string, number> = {}
        // Inicializar dias
        const diasSemana = []
        for (let i = 6; i >= 0; i--) {
            const d = subDays(new Date(), i)
            const diaKey = format(d, 'EEE', { locale: es }) // 'lun', 'mar'
            const diaLabel = diaKey.charAt(0).toUpperCase() + diaKey.slice(1)
            actividadMap[diaLabel] = 0
            diasSemana.push(diaLabel)
        }

        logs.forEach(log => {
            const key = format(new Date(log.created_at), 'EEE', { locale: es })
            const label = key.charAt(0).toUpperCase() + key.slice(1)
            if (actividadMap[label] !== undefined) {
                actividadMap[label]++
            }
        })

        const actividadDiaria = diasSemana.map(dia => ({
            dia,
            acciones: actividadMap[dia]
        }))


        // -- Totales Generales --
        const totalUsuarios = empresas.reduce((acc, e) => acc + e._count.usuarios, 0)
        const totalOrdenes = empresas.reduce((acc, e) => acc + e._count.ordenes, 0)
        const totalVentas = empresas.reduce((acc, e) => acc + e._count.ventas, 0)


        return NextResponse.json({
            empresasPorMes,
            empresasPorPlan,
            topEmpresas: topEmpresasWithNames,
            actividadDiaria,
            totales: {
                empresas: empresas.length,
                usuarios: totalUsuarios,
                ordenes: totalOrdenes,
                ventas: totalVentas
            }
        })

    } catch (error: any) {
        console.error('Error in superadmin stats:', error)
        return NextResponse.json({ error: 'Error al cargar estadísticas' }, { status: 500 })
    }
}
