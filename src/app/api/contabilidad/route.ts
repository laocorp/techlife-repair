import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

// GET /api/contabilidad - Obtener movimientos contables
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')
        const mes = searchParams.get('mes') // YYYY-MM format

        if (!empresaId) {
            return NextResponse.json(
                { error: 'empresa_id es requerido' },
                { status: 400 }
            )
        }

        let inicio: Date, fin: Date

        if (mes) {
            const [year, month] = mes.split('-').map(Number)
            inicio = new Date(year, month - 1, 1)
            fin = endOfMonth(inicio)
        } else {
            inicio = startOfMonth(new Date())
            fin = endOfMonth(new Date())
        }

        const movimientos = await prisma.contabilidad.findMany({
            where: {
                empresa_id: empresaId,
                fecha: {
                    gte: inicio,
                    lte: fin
                }
            },
            orderBy: { fecha: 'desc' }
        })

        return NextResponse.json(movimientos)
    } catch (error) {
        console.error('Error fetching contabilidad:', error)
        return NextResponse.json(
            { error: 'Error al obtener movimientos' },
            { status: 500 }
        )
    }
}

// POST /api/contabilidad - Crear movimiento
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { empresa_id, tipo, categoria, monto, descripcion, fecha } = body

        const movimiento = await prisma.contabilidad.create({
            data: {
                empresa_id,
                tipo,
                categoria,
                monto: parseFloat(monto),
                descripcion: descripcion || null,
                fecha: new Date(fecha)
            }
        })

        return NextResponse.json(movimiento)
    } catch (error) {
        console.error('Error creating movimiento:', error)
        return NextResponse.json(
            { error: 'Error al crear movimiento' },
            { status: 500 }
        )
    }
}
