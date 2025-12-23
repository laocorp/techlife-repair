import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            empresa_id,
            orden_id,
            monto,
            metodo, // efectivo, transferencia, etc.
            referencia,
            nota,
            registrado_por_id
        } = body

        if (!orden_id || !monto || !empresa_id) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
        }

        const montoDecimal = parseFloat(monto)

        // 1. Check Order
        const orden = await prisma.ordenServicio.findUnique({
            where: { id: orden_id }
        })
        if (!orden) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

        const result = await prisma.$transaction(async (tx) => {
            // A. Create Pago
            const pago = await tx.pago.create({
                data: {
                    empresa_id,
                    orden_id,
                    monto: montoDecimal,
                    metodo,
                    referencia,
                    nota,
                    registrado_por_id
                }
            })

            // B. If Cash & Open Box -> Create Movimiento
            if (metodo === 'efectivo' && registrado_por_id) {
                const cajaAbierta = await tx.caja.findFirst({
                    where: { usuario_id: registrado_por_id, estado: 'abierta', empresa_id }
                })

                if (cajaAbierta) {
                    const mov = await tx.cajaMovimiento.create({
                        data: {
                            caja_id: cajaAbierta.id,
                            tipo: 'ingreso',
                            monto: montoDecimal,
                            concepto: `Abono Orden #${orden.numero}`,
                            // Link to Pago? Needs schema update for direct link if not done.
                            // I added `caja_movimiento_id` to Pago, and `pago` to Movimiento relation.
                        }
                    })
                    // Link Pago to Movimiento
                    await tx.pago.update({
                        where: { id: pago.id },
                        data: { caja_movimiento_id: mov.id }
                    })
                }
            }

            // C. Update Order Payment Status
            // Calculate total paid including this one
            const allPagos = await tx.pago.findMany({
                where: { orden_id: orden_id }
            })
            const totalPagado = allPagos.reduce((acc, p) => acc + Number(p.monto), 0)

            // Determine status
            const costoFinal = Number(orden.costo_final || 0)
            let nuevoEstadoPago = 'pendiente'
            if (totalPagado >= costoFinal && costoFinal > 0) {
                nuevoEstadoPago = 'pagado'
            } else if (totalPagado > 0) {
                nuevoEstadoPago = 'parcial'
            } else {
                nuevoEstadoPago = 'pendiente'
            }

            // Only update if changed
            if (orden.estado_pago !== nuevoEstadoPago) {
                await tx.ordenServicio.update({
                    where: { id: orden_id },
                    data: { estado_pago: nuevoEstadoPago }
                })
            }

            return pago
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
        console.error('Error creating pago:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const orden_id = searchParams.get('orden_id')
    const empresa_id = searchParams.get('empresa_id')

    if (!empresa_id) return NextResponse.json({ error: 'Empresa ID requerido' }, { status: 400 })

    const where: any = { empresa_id }
    if (orden_id) where.orden_id = orden_id

    const pagos = await prisma.pago.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: { registrado_por: { select: { nombre: true } } }
    })

    return NextResponse.json(pagos)
}
