import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/ordenes - Obtener órdenes de la empresa
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const clienteId = searchParams.get('cliente_id')
        const estado = searchParams.get('estado')
        const limit = parseInt(searchParams.get('limit') || '50')

        // Allow filtering by cliente_id for cliente portal
        if (clienteId) {
            const ordenes = await prisma.ordenServicio.findMany({
                where: { cliente_id: clienteId },
                orderBy: { created_at: 'desc' },
                take: limit
            })
            return NextResponse.json(ordenes)
        }

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        const where: any = { empresa_id: empresaId }
        if (estado && estado !== 'todos') {
            where.estado = estado
        }

        const ordenes = await prisma.ordenServicio.findMany({
            where,
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                        identificacion: true
                    }
                },
                tecnico: {
                    select: {
                        id: true,
                        nombre: true
                    }
                },
                repuestos: { // Include parts
                    include: {
                        producto: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: limit
        })

        return NextResponse.json(ordenes)
    } catch (error) {
        console.error('Error fetching ordenes:', error)
        return NextResponse.json(
            { error: 'Error al obtener órdenes' },
            { status: 500 }
        )
    }
}

// POST /api/ordenes - Crear nueva orden
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            empresa_id,
            cliente_id,
            equipo_tipo,
            equipo_marca,
            equipo_modelo,
            equipo_serie,
            equipo_accesorios,
            problema_reportado,
            prioridad,
            costo_estimado,
            fecha_promesa,
            tecnico_id,
            creado_por_id,
            mano_obra,
            repuestos // Array of { producto_id, cantidad, precio_unitario }
        } = body

        if (!empresa_id || !cliente_id || !equipo_tipo || !equipo_marca || !problema_reportado) {
            return NextResponse.json(
                { error: 'Campos requeridos faltantes' },
                { status: 400 }
            )
        }

        // Generar número de orden único
        // 1. Obtener datos de empresa para el prefijo
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresa_id },
            select: { nombre: true }
        })

        const nombreClean = empresa?.nombre?.replace(/[^a-zA-Z]/g, '').toUpperCase() || 'REP'
        const prefix = nombreClean.substring(0, 3)
        // 2. Generar sufijo aleatorio
        const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
        const numero = `${prefix}-${suffix}`

        // Calculate Costo Final if Repuestos provided
        let costoFinalCalc = 0
        const moValue = mano_obra ? parseFloat(mano_obra) : 0
        costoFinalCalc += moValue

        let repuestosCreateData: any[] = []
        if (repuestos && Array.isArray(repuestos)) {
            repuestosCreateData = repuestos.map((r: any) => {
                const sub = (r.cantidad || 1) * (r.precio_unitario || 0)
                costoFinalCalc += sub
                return {
                    producto_id: r.producto_id,
                    cantidad: r.cantidad || 1,
                    precio_unitario: r.precio_unitario,
                    subtotal: sub
                }
            })
        }

        const orden = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Process Stock Deduction
            if (repuestosCreateData.length > 0) {
                for (const item of repuestosCreateData) {
                    const producto = await tx.producto.findUnique({
                        where: { id: item.producto_id }
                    })

                    if (!producto) {
                        throw new Error(`Producto no encontrado: ${item.producto_id}`)
                    }

                    if (producto.stock < item.cantidad) {
                        throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`)
                    }

                    await tx.producto.update({
                        where: { id: item.producto_id },
                        data: { stock: { decrement: item.cantidad } }
                    })
                }
            }

            // 2. Create Order
            return await tx.ordenServicio.create({
                data: {
                    numero,
                    empresa_id,
                    cliente_id,
                    equipo_tipo,
                    equipo_marca,
                    equipo_modelo,
                    equipo_serie,
                    equipo_accesorios,
                    problema_reportado,
                    prioridad: prioridad || 'normal',
                    costo_estimado: costo_estimado ? parseFloat(costo_estimado) : null,
                    costo_final: costoFinalCalc > 0 ? costoFinalCalc : null,
                    mano_obra: moValue,
                    fecha_promesa: fecha_promesa ? new Date(fecha_promesa) : null,
                    tecnico_id,
                    creado_por_id,
                    estado: 'recibido',
                    repuestos: repuestosCreateData.length > 0 ? {
                        create: repuestosCreateData
                    } : undefined
                },
                include: {
                    cliente: true,
                    tecnico: true,
                    repuestos: true
                }
            })
        })

        return NextResponse.json(orden, { status: 201 })
    } catch (error) {
        console.error('Error creating orden:', error)
        return NextResponse.json(
            { error: 'Error al crear orden' },
            { status: 500 }
        )
    }
}
