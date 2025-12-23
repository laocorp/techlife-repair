import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { validateP12Certificate } from '@/lib/sri/xml-signer'

// POST /api/empresas/[id]/certificate - Subir certificado P12
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const password = formData.get('password') as string | null

        if (!file || !password) {
            return NextResponse.json(
                { error: 'Se requiere archivo y contraseña' },
                { status: 400 }
            )
        }

        if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
            return NextResponse.json(
                { error: 'El archivo debe ser .p12 o .pfx' },
                { status: 400 }
            )
        }

        // Validate certificate
        const buffer = await file.arrayBuffer()
        const validation = await validateP12Certificate(buffer, password)

        if (!validation.valid || !validation.info) {
            return NextResponse.json(
                { error: validation.error || 'Certificado inválido' },
                { status: 400 }
            )
        }

        // Save file locally (outside public folder for security)
        // We'll store it in a 'private' folder in the project root
        const uploadDir = path.join(process.cwd(), 'private', 'certificados', id)
        await mkdir(uploadDir, { recursive: true })

        const fileName = 'firma.p12'
        const filePath = path.join(uploadDir, fileName)

        // Write file to disk
        await writeFile(filePath, Buffer.from(buffer))

        // Update Empresa record
        // Note: In a production environment, the password should be encrypted
        const empresa = await prisma.empresa.update({
            where: { id },
            data: {
                certificado_p12_url: filePath,
                certificado_password: password,
                certificado_vence: validation.info.validTo,
                ambiente_sri: 'produccion', // Auto-switch to production capable? Maybe let user decide.
            }
        })

        // Also update separate configuration table if it exists


        return NextResponse.json({
            success: true,
            info: {
                commonName: validation.info.commonName,
                validTo: validation.info.validTo,
                issues: validation.info.issuer
            }
        })

    } catch (error: any) {
        console.error('Error uploading certificate:', error)
        return NextResponse.json(
            { error: error.message || 'Error al subir certificado' },
            { status: 500 }
        )
    }
}

// DELETE /api/empresas/[id]/certificate - Eliminar certificado
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Update DB
        await prisma.empresa.update({
            where: { id },
            data: {
                certificado_p12_url: null,
                certificado_password: null,
                certificado_vence: null
            }
        })

        // Optional: Delete file from disk (or keep for audit)
        // For now, we just remove the reference

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting certificate:', error)
        return NextResponse.json(
            { error: 'Error al eliminar certificado' },
            { status: 500 }
        )
    }
}
