// API Route: GET all permissions, POST create role
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Type definitions for Prisma results
interface RoleWithPermissions {
    id: string
    nombre: string
    descripcion: string | null
    es_sistema: boolean
    empresa_id: string | null
    created_at: Date
    updated_at: Date
    permisos: Array<{
        permission: {
            id: string
            codigo: string
            nombre: string
            modulo: string
            descripcion: string | null
        }
    }>
    _count: {
        usuarios: number
    }
}
// GET /api/roles - List all roles for an empresa
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const empresaId = searchParams.get('empresa_id')

        if (!empresaId) {
            return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
        }

        const roles = await prisma.role.findMany({
            where: {
                OR: [
                    { empresa_id: empresaId },
                    { empresa_id: null }, // Global roles
                ],
            },
            include: {
                permisos: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: { usuarios: true },
                },
            },
            orderBy: [
                { es_sistema: 'desc' },
                { nombre: 'asc' },
            ],
        })

        // Transform to include permissions array
        const rolesWithPermissions = roles.map((role: RoleWithPermissions) => ({
            id: role.id,
            nombre: role.nombre,
            descripcion: role.descripcion,
            es_sistema: role.es_sistema,
            empresa_id: role.empresa_id,
            created_at: role.created_at,
            updated_at: role.updated_at,
            usuarios_count: role._count.usuarios,
            permisos: role.permisos.map((rp: RoleWithPermissions['permisos'][0]) => rp.permission),
        }))

        return NextResponse.json(rolesWithPermissions)
    } catch (error: unknown) {
        console.error('Error fetching roles:', error)
        return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
    }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { empresa_id, nombre, descripcion, permisos } = body

        if (!empresa_id || !nombre) {
            return NextResponse.json(
                { error: 'empresa_id y nombre son requeridos' },
                { status: 400 }
            )
        }

        // Check if role name already exists
        const existingRole = await prisma.role.findFirst({
            where: {
                nombre,
                OR: [
                    { empresa_id },
                    { empresa_id: null },
                ],
            },
        })

        if (existingRole) {
            return NextResponse.json(
                { error: 'Ya existe un rol con ese nombre' },
                { status: 400 }
            )
        }

        // Create role with permissions
        const role = await prisma.role.create({
            data: {
                empresa_id,
                nombre,
                descripcion,
                es_sistema: false,
                permisos: permisos?.length
                    ? {
                        create: permisos.map((permissionId: string) => ({
                            permission_id: permissionId,
                        })),
                    }
                    : undefined,
            },
            include: {
                permisos: {
                    include: {
                        permission: true,
                    },
                },
            },
        })

        return NextResponse.json(role, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating role:', error)
        return NextResponse.json({ error: 'Error al crear rol' }, { status: 500 })
    }
}
