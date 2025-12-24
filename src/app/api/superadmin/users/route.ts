import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/superadmin/users - Crear usuario en empresa existente (Solo Super Admin)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            nombre,
            email,
            password,
            empresa_id,
            rol = 'admin',
        } = body

        // Validaciones básicas
        if (!nombre || !email || !password || !empresa_id) {
            return NextResponse.json(
                { error: 'nombre, email, password y empresa_id son requeridos' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar que la empresa existe
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresa_id }
        })

        if (!empresa) {
            return NextResponse.json(
                { error: 'Empresa no encontrada' },
                { status: 404 }
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

        // Crear Usuario
        const usuario = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: hashedPassword,
                rol,
                empresa_id,
                activo: true
            },
            include: {
                empresa: {
                    select: {
                        id: true,
                        nombre: true,
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Usuario creado exitosamente',
            user: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol,
                empresa: usuario.empresa
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Error al crear usuario' },
            { status: 500 }
        )
    }
}
