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

        // 1. Try to get subscription with plan relation
        let suscripcion: any = await prisma.suscripcion.findFirst({
            where: { empresa_id: empresaId },
            include: {
                plan: true
            }
        })

        // 2. Fallback: If no subscription record found, check legacy fields in Empresa
        if (!suscripcion) {
            const empresa = await prisma.empresa.findUnique({
                where: { id: empresaId }
            })

            if (empresa && (empresa.suscripcion_activa || empresa.plan === 'trial')) {
                // Define default limits for fallback plans
                const fallbackPlans: Record<string, any> = {
                    trial: {
                        nombre: 'Prueba',
                        max_usuarios: 2,
                        max_ordenes_mes: 20,
                        max_productos: 50,
                        max_facturas_mes: 10
                    },
                    basic: {
                        nombre: 'Básico',
                        max_usuarios: 3,
                        max_ordenes_mes: 100,
                        max_productos: 200,
                        max_facturas_mes: 50
                    },
                    pro: {
                        nombre: 'Profesional',
                        max_usuarios: 5,
                        max_ordenes_mes: 300,
                        max_productos: 1000,
                        max_facturas_mes: 100
                    },
                    unlimited: {
                        nombre: 'Ilimitado',
                        max_usuarios: 9999,
                        max_ordenes_mes: 9999,
                        max_productos: 9999,
                        max_facturas_mes: 9999
                    }
                }

                const planName = empresa.plan || 'trial'
                const planStats = fallbackPlans[planName] || fallbackPlans.trial

                suscripcion = {
                    id: 'legacy',
                    estado: empresa.suscripcion_activa ? 'activa' : 'vencida',
                    // Si es trial, mostrar como Estado Trial
                    // estado: planName === 'trial' && empresa.suscripcion_activa ? 'trial' : (empresa.suscripcion_activa ? 'activa' : 'vencida'), 
                    // Simpler: use existing logic
                    fecha_inicio: empresa.created_at,
                    fecha_fin: empresa.fecha_vencimiento,
                    periodo: 'mensual',
                    plan: {
                        id: planName,
                        nombre: planStats.nombre,
                        tipo: planName,
                        ...planStats
                    }
                }

                // Override status specifically for trial
                if (planName === 'trial' && empresa.suscripcion_activa) {
                    suscripcion.estado = 'trial'
                }
            }
        }

        // Calculate usage (Same as before)
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
