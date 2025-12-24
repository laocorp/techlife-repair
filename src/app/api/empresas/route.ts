import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/empresas - Listar todas las empresas (Solo Super Admin)
export async function GET(request: NextRequest) {
    try {
        const empresas = await prisma.empresa.findMany({
            include: {
                _count: {
                    select: {
                        usuarios: true,
                        ordenes: true,
                        ventas: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(empresas)
    } catch (error) {
        console.error('Error fetching empresas:', error)
        return NextResponse.json(
            { error: 'Error al obtener empresas' },
            { status: 500 }
        )
    }
}

// POST /api/empresas - Crear nueva empresa
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            nombre,
            ruc,
            email,
            telefono,
            direccion,
            plan,
            suscripcion_activa,
            fecha_vencimiento
        } = body

        if (!nombre) {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            )
        }

        const empresa = await prisma.empresa.create({
            data: {
                nombre,
                ruc: ruc || null,
                email: email || null,
                telefono: telefono || null,
                direccion: direccion || null,
                plan: plan || 'trial',
                suscripcion_activa: suscripcion_activa ?? true,
                fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
            }
        })

        return NextResponse.json(empresa, { status: 201 })
    } catch (error: any) {
        console.error('Error creating empresa:', error)
        return NextResponse.json(
            { error: 'Error al crear empresa' },
            { status: 500 }
        )
    }
}
