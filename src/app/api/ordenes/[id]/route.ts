import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/ordenes/[id] - Obtener una orden
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const orden = await prisma.ordenServicio.findUnique({
            where: { id },
            include: {
                cliente: true,
                tecnico: {
                    select: { id: true, nombre: true, email: true }
                },
                creado_por: {
                    select: { id: true, nombre: true }
                },
                repuestos: {
                    include: {
                        producto: true
                    }
                },
                pagos: {
                    include: {
                        registrado_por: {
                            select: { nombre: true }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        })

        if (!orden) {
            return NextResponse.json(
                { error: 'Orden no encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(orden)
    } catch (error) {
        console.error('Error fetching orden:', error)
        return NextResponse.json(
            { error: 'Error al obtener orden' },
            { status: 500 }
        )
    }
}

// PATCH /api/ordenes/[id] - Actualizar orden
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            estado,
            prioridad,
            diagnostico,
            solucion,
            costo_estimado,
            costo_final, // This falls back to manual override or frontend calc
            anticipo,
            mano_obra,
            fecha_promesa,
            fecha_entrega,
            tecnico_id,
            repuestos // Array of { producto_id, cantidad, precio_unitario }
        } = body

        const orden = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Handle Repuestos (Stock Management)
            if (repuestos !== undefined && Array.isArray(repuestos)) {
                // A. Revert Stock for EXISTING items (Return to shelf)
                const currentItems = await tx.ordenRepuesto.findMany({
                    where: { orden_id: id }
                })

                for (const item of currentItems) {
                    await tx.producto.update({
                        where: { id: item.producto_id },
                        data: { stock: { increment: item.cantidad } }
                    })
                }

                // B. Delete existing relation entries
                await tx.ordenRepuesto.deleteMany({
                    where: { orden_id: id }
                })

                // C. Process NEW items (Check & Deduct Stock)
                for (const r of repuestos) {
                    const producto = await tx.producto.findUnique({
                        where: { id: r.producto_id }
                    })

                    if (!producto) {
                        throw new Error(`Producto no encontrado: ${r.producto_id}`)
                    }

                    if (producto.stock < r.cantidad) {
                        throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`)
                    }

                    // Deduct Stock
                    await tx.producto.update({
                        where: { id: r.producto_id },
                        data: { stock: { decrement: r.cantidad } }
                    })

                    // Create new relation entry
                    await tx.ordenRepuesto.create({
                        data: {
                            orden_id: id,
                            producto_id: r.producto_id,
                            cantidad: r.cantidad,
                            precio_unitario: r.precio_unitario,
                            subtotal: (r.cantidad * r.precio_unitario)
                        }
                    })
                }
            }

            // 2. Prepare Update Data for Order
            const updateData: any = {}
            if (estado !== undefined) updateData.estado = estado
            if (prioridad !== undefined) updateData.prioridad = prioridad
            if (diagnostico !== undefined) updateData.diagnostico = diagnostico
            if (solucion !== undefined) updateData.solucion = solucion
            if (costo_estimado !== undefined) updateData.costo_estimado = parseFloat(costo_estimado)

            // Recalculate Costo Final automatically if repuestos provided?
            // Prioritize frontend value if sent, otherwise logic could be here.
            // For now, trust frontend calculated value if passed, or allow independent update.
            if (costo_final !== undefined) updateData.costo_final = parseFloat(costo_final)

            if (anticipo !== undefined) updateData.anticipo = parseFloat(anticipo)
            if (mano_obra !== undefined) updateData.mano_obra = parseFloat(mano_obra)
            if (fecha_promesa !== undefined) updateData.fecha_promesa = fecha_promesa ? new Date(fecha_promesa) : null
            if (fecha_entrega !== undefined) updateData.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : null
            if (tecnico_id !== undefined) updateData.tecnico_id = tecnico_id

            const updatedOrder = await tx.ordenServicio.update({
                where: { id },
                data: updateData,
                include: {
                    cliente: true,
                    tecnico: {
                        select: { id: true, nombre: true }
                    },
                    repuestos: {
                        include: { producto: true }
                    }
                }
            })

            // Trigger Notification if status changed
            if (estado) {
                await tx.notificacion.create({
                    data: {
                        empresa_id: updatedOrder.empresa_id,
                        tipo: estado === 'mensajero' ? 'orden' : (estado === 'terminado' || estado === 'entregado' ? 'completada' : 'orden'),
                        titulo: `Orden Actualizada #${updatedOrder.numero}`,
                        mensaje: `El estado de la orden ha cambiado a: ${estado.toUpperCase()}`,
                        link: `/ordenes/${updatedOrder.id}`
                    }
                })
            }

            return updatedOrder
        })

        return NextResponse.json(orden)
    } catch (error: any) {
        console.error('Error updating orden:', error)
        return NextResponse.json(
            { error: error.message || 'Error al actualizar orden' },
            { status: 500 }
        )
    }
}

// DELETE /api/ordenes/[id] - Eliminar orden
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.ordenServicio.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting orden:', error)
        return NextResponse.json(
            { error: 'Error al eliminar orden' },
            { status: 500 }
        )
    }
}
