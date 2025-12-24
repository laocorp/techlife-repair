// Script para crear Super Admin - Ejecutar con: node prisma/create-superadmin.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Creando Super Admin...\n');

    let empresa = await prisma.empresa.findFirst({ where: { ruc: '0000000000001' } });

    if (!empresa) {
        empresa = await prisma.empresa.create({
            data: {
                nombre: 'RepairApp System',
                ruc: '0000000000001',
                direccion: 'Sistema',
                telefono: '0000000000',
                email: 'system@repairapp.com',
                plan: 'enterprise',
                suscripcion_activa: true,
                fecha_vencimiento: new Date('2099-12-31'),
            }
        });
        console.log('✅ Empresa del sistema creada');
    }

    const existing = await prisma.usuario.findUnique({ where: { email: 'superadmin@repairapp.com' } });

    if (existing) {
        if (existing.rol !== 'superadmin') {
            await prisma.usuario.update({ where: { id: existing.id }, data: { rol: 'superadmin' } });
            console.log('✅ Usuario actualizado a superadmin');
        } else {
            console.log('⚠️  Super Admin ya existe');
        }
    } else {
        const hash = await bcrypt.hash('SuperAdmin123!', 12);
        await prisma.usuario.create({
            data: {
                email: 'superadmin@repairapp.com',
                password: hash,
                nombre: 'Super Administrador',
                rol: 'superadmin',
                activo: true,
                empresa_id: empresa.id,
            }
        });
        console.log('\n✅ Super Admin creado!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    superadmin@repairapp.com');
        console.log('🔑 Password: SuperAdmin123!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Cambia la contraseña después del primer login!');
    }
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
