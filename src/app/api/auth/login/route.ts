import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            )
        }

        // Buscar usuario con su empresa
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: {
                empresa: true
            }
        })

        if (!usuario) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            )
        }

        if (!usuario.activo) {
            return NextResponse.json(
                { error: 'Usuario desactivado' },
                { status: 401 }
            )
        }

        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, usuario.password)

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            )
        }

        // Verificar suscripción de empresa
        if (!usuario.empresa.suscripcion_activa) {
            return NextResponse.json(
                { error: 'La suscripción de la empresa ha expirado' },
                { status: 403 }
            )
        }

        // Retornar usuario sin password
        const { password: _, ...userWithoutPassword } = usuario

        return NextResponse.json({
            success: true,
            user: {
                id: userWithoutPassword.id,
                email: userWithoutPassword.email,
                nombre: userWithoutPassword.nombre,
                rol: userWithoutPassword.rol,
                empresa_id: userWithoutPassword.empresa_id,
                empresa: {
                    id: userWithoutPassword.empresa.id,
                    nombre: userWithoutPassword.empresa.nombre,
                    logo_url: userWithoutPassword.empresa.logo_url,
                    plan: userWithoutPassword.empresa.plan,
                }
            }
        })

    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
