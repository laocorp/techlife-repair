// API Route: GET all permissions
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/permisos - List all available permissions
export async function GET() {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: [
                { modulo: 'asc' },
                { nombre: 'asc' },
            ],
        })

        // Group permissions by module
        const grouped = permissions.reduce((acc, permission) => {
            if (!acc[permission.modulo]) {
                acc[permission.modulo] = []
            }
            acc[permission.modulo].push(permission)
            return acc
        }, {} as Record<string, typeof permissions>)

        return NextResponse.json({
            permissions,
            grouped,
        })
    } catch (error: unknown) {
        console.error('Error fetching permissions:', error)
        return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
    }
}
