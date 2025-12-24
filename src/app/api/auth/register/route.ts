import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            nombre,
            email,
            password,
            empresaNombre,
            empresaRuc,
            empresaTelefono,
            empresaDireccion
        } = body

        // Validaciones básicas
        if (!nombre || !email || !password || !empresaNombre || !empresaRuc) {
            return NextResponse.json(
                { error: 'Todos los campos marcados con * son obligatorios' },
                { status: 400 }
            )
        }

        // Verificar si el email ya existe
        const existingUser = await prisma.usuario.findFirst({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'El correo electrónico ya está registrado' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear empresa y usuario en una transacción
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Crear Empresa
            const empresa = await tx.empresa.create({
                data: {
                    nombre: empresaNombre,
                    ruc: empresaRuc,
                    telefono: empresaTelefono,
                    direccion: empresaDireccion,
                    plan: 'trial', // Plan gratuito por defecto
                    suscripcion_activa: true,
                    // Fecha vencimiento en 14 días
                    fecha_vencimiento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                }
            })

            // 2. Crear Usuario Admin
            const usuario = await tx.usuario.create({
                data: {
                    nombre,
                    email,
                    password: hashedPassword,
                    rol: 'admin',
                    empresa_id: empresa.id,
                    activo: true
                }
            })

            return { empresa, usuario }
        })

        return NextResponse.json({
            success: true,
            message: 'Cuenta creada exitosamente',
            user: {
                id: result.usuario.id,
                email: result.usuario.email,
                nombre: result.usuario.nombre,
                empresa: {
                    id: result.empresa.id,
                    nombre: result.empresa.nombre
                }
            }
        })

    } catch (error: any) {
        console.error('Registration error:', error)
        return NextResponse.json(
            {
                error: 'Error al procesar el registro',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
