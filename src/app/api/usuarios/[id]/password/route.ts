import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PATCH /api/usuarios/[id]/password - Cambiar contraseña
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const { newPassword } = body

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.usuario.update({
            where: { id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error changing password:', error)
        return NextResponse.json(
            { error: 'Error al cambiar contraseña' },
            { status: 500 }
        )
    }
}
