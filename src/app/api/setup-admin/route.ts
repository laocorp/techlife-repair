
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const secret = searchParams.get('secret')
    const email = searchParams.get('email') || 'calderaj.lao@gmail.com'

    // Simple protection
    if (secret !== 'repairapp-admin-setup-2024') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const user = await prisma.usuario.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found', email }, { status: 404 })
        }

        const updated = await prisma.usuario.update({
            where: { email },
            data: { rol: 'admin' }
        })

        return NextResponse.json({
            success: true,
            message: `User ${email} promoted to admin`,
            user: { id: updated.id, nombre: updated.nombre, rol: updated.rol }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
