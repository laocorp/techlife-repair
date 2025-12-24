// API Route: GET, PATCH, DELETE individual role
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/roles/[id] - Get single role with permissions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const role = await prisma.role.findUnique({
            where: { id },
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
        })

        if (!role) {
            return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
        }

        return NextResponse.json({
            ...role,
            usuarios_count: role._count.usuarios,
            permisos: role.permisos.map((rp) => rp.permission),
        })
    } catch (error: unknown) {
        console.error('Error fetching role:', error)
        return NextResponse.json({ error: 'Error al obtener rol' }, { status: 500 })
    }
}

// PATCH /api/roles/[id] - Update role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { nombre, descripcion, permisos } = body

        // Check if role exists
        const existingRole = await prisma.role.findUnique({
            where: { id },
        })

        if (!existingRole) {
            return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
        }

        // System roles can only have permissions updated, not name
        if (existingRole.es_sistema && nombre && nombre !== existingRole.nombre) {
            return NextResponse.json(
                { error: 'No se puede cambiar el nombre de un rol del sistema' },
                { status: 400 }
            )
        }

        // If permisos is provided, update them
        if (permisos !== undefined) {
            // Delete existing permissions
            await prisma.rolePermission.deleteMany({
                where: { role_id: id },
            })

            // Create new permissions
            if (permisos.length > 0) {
                await prisma.rolePermission.createMany({
                    data: permisos.map((permissionId: string) => ({
                        role_id: id,
                        permission_id: permissionId,
                    })),
                })
            }
        }

        // Update role
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                ...(nombre && !existingRole.es_sistema ? { nombre } : {}),
                ...(descripcion !== undefined ? { descripcion } : {}),
            },
            include: {
                permisos: {
                    include: {
                        permission: true,
                    },
                },
            },
        })

        return NextResponse.json({
            ...updatedRole,
            permisos: updatedRole.permisos.map((rp) => rp.permission),
        })
    } catch (error: unknown) {
        console.error('Error updating role:', error)
        return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 })
    }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check if role exists
        const existingRole = await prisma.role.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { usuarios: true },
                },
            },
        })

        if (!existingRole) {
            return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
        }

        // System roles cannot be deleted
        if (existingRole.es_sistema) {
            return NextResponse.json(
                { error: 'No se puede eliminar un rol del sistema' },
                { status: 400 }
            )
        }

        // Roles with users cannot be deleted
        if (existingRole._count.usuarios > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un rol que tiene usuarios asignados' },
                { status: 400 }
            )
        }

        await prisma.role.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error('Error deleting role:', error)
        return NextResponse.json({ error: 'Error al eliminar rol' }, { status: 500 })
    }
}
