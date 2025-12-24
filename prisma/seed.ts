// Prisma Seed Script for RBAC
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define all permissions
const permissions = [
    // Dashboard
    { codigo: 'dashboard.view', nombre: 'Ver Dashboard', modulo: 'dashboard', descripcion: 'Acceder al panel principal' },
    { codigo: 'dashboard.stats', nombre: 'Ver Estadísticas', modulo: 'dashboard', descripcion: 'Ver métricas y estadísticas' },

    // POS
    { codigo: 'pos.view', nombre: 'Ver POS', modulo: 'pos', descripcion: 'Acceder al punto de venta' },
    { codigo: 'pos.sell', nombre: 'Realizar Ventas', modulo: 'pos', descripcion: 'Procesar ventas en el POS' },
    { codigo: 'pos.discount', nombre: 'Aplicar Descuentos', modulo: 'pos', descripcion: 'Aplicar descuentos en ventas' },
    { codigo: 'pos.void', nombre: 'Anular Ventas', modulo: 'pos', descripcion: 'Anular transacciones del POS' },

    // Inventory
    { codigo: 'inventory.view', nombre: 'Ver Inventario', modulo: 'inventory', descripcion: 'Ver productos e inventario' },
    { codigo: 'inventory.create', nombre: 'Crear Productos', modulo: 'inventory', descripcion: 'Agregar nuevos productos' },
    { codigo: 'inventory.update', nombre: 'Editar Productos', modulo: 'inventory', descripcion: 'Modificar productos existentes' },
    { codigo: 'inventory.delete', nombre: 'Eliminar Productos', modulo: 'inventory', descripcion: 'Eliminar productos' },
    { codigo: 'inventory.adjust', nombre: 'Ajustar Stock', modulo: 'inventory', descripcion: 'Modificar cantidades de inventario' },

    // Orders
    { codigo: 'orders.view', nombre: 'Ver Órdenes', modulo: 'orders', descripcion: 'Ver órdenes de servicio' },
    { codigo: 'orders.create', nombre: 'Crear Órdenes', modulo: 'orders', descripcion: 'Crear nuevas órdenes de servicio' },
    { codigo: 'orders.update', nombre: 'Editar Órdenes', modulo: 'orders', descripcion: 'Modificar órdenes existentes' },
    { codigo: 'orders.delete', nombre: 'Eliminar Órdenes', modulo: 'orders', descripcion: 'Eliminar órdenes de servicio' },
    { codigo: 'orders.assign', nombre: 'Asignar Técnicos', modulo: 'orders', descripcion: 'Asignar técnicos a órdenes' },

    // Cash
    { codigo: 'cash.view', nombre: 'Ver Caja', modulo: 'cash', descripcion: 'Ver estado de caja' },
    { codigo: 'cash.open', nombre: 'Abrir Caja', modulo: 'cash', descripcion: 'Iniciar sesión de caja' },
    { codigo: 'cash.close', nombre: 'Cerrar Caja', modulo: 'cash', descripcion: 'Cerrar sesión de caja' },
    { codigo: 'cash.movements', nombre: 'Registrar Movimientos', modulo: 'cash', descripcion: 'Registrar ingresos y egresos' },

    // Clients
    { codigo: 'clients.view', nombre: 'Ver Clientes', modulo: 'clients', descripcion: 'Ver lista de clientes' },
    { codigo: 'clients.create', nombre: 'Crear Clientes', modulo: 'clients', descripcion: 'Registrar nuevos clientes' },
    { codigo: 'clients.update', nombre: 'Editar Clientes', modulo: 'clients', descripcion: 'Modificar datos de clientes' },
    { codigo: 'clients.delete', nombre: 'Eliminar Clientes', modulo: 'clients', descripcion: 'Eliminar clientes' },

    // Reports
    { codigo: 'reports.view', nombre: 'Ver Reportes', modulo: 'reports', descripcion: 'Acceder a reportes' },
    { codigo: 'reports.export', nombre: 'Exportar Reportes', modulo: 'reports', descripcion: 'Exportar reportes a CSV/Excel' },

    // Invoices
    { codigo: 'invoices.view', nombre: 'Ver Facturas', modulo: 'invoices', descripcion: 'Ver facturas electrónicas' },
    { codigo: 'invoices.create', nombre: 'Emitir Facturas', modulo: 'invoices', descripcion: 'Generar facturas electrónicas' },
    { codigo: 'invoices.void', nombre: 'Anular Facturas', modulo: 'invoices', descripcion: 'Anular facturas emitidas' },

    // Settings
    { codigo: 'settings.view', nombre: 'Ver Configuración', modulo: 'settings', descripcion: 'Ver configuración del sistema' },
    { codigo: 'settings.update', nombre: 'Editar Configuración', modulo: 'settings', descripcion: 'Modificar configuración' },

    // Users
    { codigo: 'users.view', nombre: 'Ver Usuarios', modulo: 'users', descripcion: 'Ver lista de usuarios' },
    { codigo: 'users.create', nombre: 'Crear Usuarios', modulo: 'users', descripcion: 'Registrar nuevos usuarios' },
    { codigo: 'users.update', nombre: 'Editar Usuarios', modulo: 'users', descripcion: 'Modificar usuarios existentes' },
    { codigo: 'users.delete', nombre: 'Eliminar Usuarios', modulo: 'users', descripcion: 'Eliminar usuarios' },

    // Roles
    { codigo: 'roles.view', nombre: 'Ver Roles', modulo: 'roles', descripcion: 'Ver roles y permisos' },
    { codigo: 'roles.manage', nombre: 'Gestionar Roles', modulo: 'roles', descripcion: 'Crear, editar y eliminar roles' },

    // Activity Logs
    { codigo: 'logs.view', nombre: 'Ver Actividad', modulo: 'logs', descripcion: 'Ver registros de actividad' },

    // Client Portal
    { codigo: 'client_portal.view', nombre: 'Ver Portal', modulo: 'client_portal', descripcion: 'Acceder al portal de cliente' },
    { codigo: 'client_portal.orders', nombre: 'Ver Mis Órdenes', modulo: 'client_portal', descripcion: 'Ver estado de órdenes propias' },
    { codigo: 'client_portal.history', nombre: 'Ver Historial', modulo: 'client_portal', descripcion: 'Ver historial de servicios' },
    { codigo: 'client_portal.payments', nombre: 'Ver Pagos', modulo: 'client_portal', descripcion: 'Ver pagos y saldos' },
]

// Define system roles with their permissions
const systemRoles = [
    {
        nombre: 'Administrador',
        descripcion: 'Acceso completo a todas las funcionalidades del sistema',
        permisos: permissions.map(p => p.codigo), // All permissions
    },
    {
        nombre: 'Técnico',
        descripcion: 'Acceso a órdenes de servicio e inventario',
        permisos: [
            'dashboard.view',
            'orders.view',
            'orders.update',
            'inventory.view',
            'clients.view',
            'reports.view',
        ],
    },
    {
        nombre: 'Vendedor',
        descripcion: 'Acceso a punto de venta, clientes y facturación',
        permisos: [
            'dashboard.view',
            'pos.view',
            'pos.sell',
            'inventory.view',
            'cash.view',
            'cash.movements',
            'clients.view',
            'clients.create',
            'clients.update',
            'invoices.view',
            'invoices.create',
        ],
    },
    {
        nombre: 'Cliente',
        descripcion: 'Acceso al portal de cliente para seguimiento de servicios',
        permisos: [
            'client_portal.view',
            'client_portal.orders',
            'client_portal.history',
            'client_portal.payments',
        ],
    },
]

async function main() {
    console.log('🌱 Seeding database with RBAC data...')

    // Create permissions
    console.log('📝 Creating permissions...')
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { codigo: permission.codigo },
            update: {
                nombre: permission.nombre,
                modulo: permission.modulo,
                descripcion: permission.descripcion,
            },
            create: permission,
        })
    }
    console.log(`✅ Created ${permissions.length} permissions`)

    // Create system roles
    console.log('👥 Creating system roles...')
    for (const roleData of systemRoles) {
        // Create or update role
        const role = await prisma.role.upsert({
            where: { nombre: roleData.nombre },
            update: {
                descripcion: roleData.descripcion,
                es_sistema: true,
            },
            create: {
                nombre: roleData.nombre,
                descripcion: roleData.descripcion,
                es_sistema: true,
                empresa_id: null, // Global role
            },
        })

        // Get permission IDs
        const permissionRecords = await prisma.permission.findMany({
            where: {
                codigo: { in: roleData.permisos },
            },
        })

        // Delete existing role-permission associations
        await prisma.rolePermission.deleteMany({
            where: { role_id: role.id },
        })

        // Create new role-permission associations
        for (const permission of permissionRecords) {
            await prisma.rolePermission.create({
                data: {
                    role_id: role.id,
                    permission_id: permission.id,
                },
            })
        }

        console.log(`  ✅ Role "${roleData.nombre}" with ${roleData.permisos.length} permissions`)
    }

    console.log('🎉 RBAC seed completed!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
