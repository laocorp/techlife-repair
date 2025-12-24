import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'

// POST /api/superadmin/impersonate - Iniciar sesión como otro usuario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, superadminId } = body

        if (!userId || !superadminId) {
            return NextResponse.json(
                { error: 'userId y superadminId son requeridos' },
                { status: 400 }
            )
        }

        // Verificar que el solicitante es superadmin
        const superadmin = await prisma.usuario.findUnique({
            where: { id: superadminId }
        })

        if (!superadmin || superadmin.rol !== 'superadmin') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            )
        }

        // Obtener el usuario a impersonar
        const targetUser = await prisma.usuario.findUnique({
            where: { id: userId },
            include: { empresa: true }
        })

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        // Registrar la acción en los logs
        await prisma.activityLog.create({
            data: {
                usuario_id: superadminId,
                empresa_id: superadmin.empresa_id,
                accion: 'impersonate',
                modulo: 'superadmin',
                entidad_id: userId,
                detalles: {
                    targetUser: targetUser.email,
                    targetEmpresa: targetUser.empresa?.nombre
                }
            }
        })

        // Crear token JWT para el usuario impersonado
        const token = sign(
            {
                userId: targetUser.id,
                email: targetUser.email,
                rol: targetUser.rol,
                empresaId: targetUser.empresa_id,
                impersonatedBy: superadminId, // Marca que es una sesión impersonada
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        )

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                nombre: targetUser.nombre,
                rol: targetUser.rol,
                empresa_id: targetUser.empresa_id,
                empresa: targetUser.empresa,
            },
            impersonatedBy: superadmin.email,
        })
    } catch (error: any) {
        console.error('Error impersonating user:', error)
        return NextResponse.json(
            { error: 'Error al impersonar usuario' },
            { status: 500 }
        )
    }
}
