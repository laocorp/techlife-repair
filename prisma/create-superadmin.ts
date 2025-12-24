// Script para crear un Super Admin
// Ejecutar: npx ts-node prisma/create-superadmin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Configuración del Super Admin
    const SUPERADMIN_EMAIL = 'superadmin@repairapp.com'
    const SUPERADMIN_PASSWORD = 'SuperAdmin123!'  // ⚠️ Cambiar después del primer login
    const SUPERADMIN_NOMBRE = 'Super Administrador'

    console.log('🔐 Creando Super Admin...\n')

    // Verificar si ya existe
    const existingUser = await prisma.usuario.findUnique({
        where: { email: SUPERADMIN_EMAIL }
    })

    if (existingUser) {
        console.log('⚠️  El Super Admin ya existe:')
        console.log(`   Email: ${existingUser.email}`)
        console.log(`   Rol: ${existingUser.rol}`)

        // Actualizar a superadmin si no lo es
        if (existingUser.rol !== 'superadmin') {
            await prisma.usuario.update({
                where: { id: existingUser.id },
                data: { rol: 'superadmin' }
            })
            console.log('\n✅ Usuario actualizado a rol superadmin')
        }
        return
    }

    // Crear empresa especial para Super Admin (sin restricciones)
    let superEmpresa = await prisma.empresa.findFirst({
        where: { ruc: '0000000000001' }
    })

    if (!superEmpresa) {
        superEmpresa = await prisma.empresa.create({
            data: {
                nombre: 'RepairApp System',
                ruc: '0000000000001',
                slug: 'system',
                direccion: 'Sistema',
                telefono: '0000000000',
                email: 'system@repairapp.com',
                plan: 'enterprise',
                suscripcion_activa: true,
                // Suscripción sin vencimiento
                fecha_vencimiento: new Date('2099-12-31'),
            }
        })
        console.log('✅ Empresa del sistema creada')
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 12)

    // Crear el Super Admin
    const superAdmin = await prisma.usuario.create({
        data: {
            email: SUPERADMIN_EMAIL,
            password: hashedPassword,
            nombre: SUPERADMIN_NOMBRE,
            rol: 'superadmin',
            activo: true,
            empresa_id: superEmpresa.id,
        }
    })

    console.log('\n✅ Super Admin creado exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Email:    ${SUPERADMIN_EMAIL}`)
    console.log(`🔑 Password: ${SUPERADMIN_PASSWORD}`)
    console.log(`👤 Nombre:   ${SUPERADMIN_NOMBRE}`)
    console.log(`🏢 Empresa:  ${superEmpresa.nombre}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
