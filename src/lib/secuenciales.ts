import { prisma } from '@/lib/prisma'

/**
 * Obtiene el siguiente número secuencial formateado para un documento.
 * Ejecuta una transacción para garantizar atomicidad.
 * 
 * @param empresaId ID de la empresa
 * @param tipo Tipo de documento ('factura', 'nota_credito', 'orden', 'venta')
 * @param establecimiento Código de establecimiento (ej. '001')
 * @param puntoEmision Código de punto de emisión (ej. '001')
 * @param prefix Prefijo opcional para documentos internos (ej. 'VTA' -> 'VTA-001-000000001')
 */
export async function getNextSecuencial(
    empresaId: string,
    tipo: 'factura' | 'nota_credito' | 'orden' | 'venta',
    establecimiento: string = '001',
    puntoEmision: string = '001',
    prefix?: string,
    txClient?: any // Prisma Transaction Client
): Promise<{ numero: string, secuencial: number }> {

    // Helper para realizar la operación
    const operation = async (tx: any) => {
        const doc = await tx.secuencial.upsert({
            where: {
                empresa_id_tipo_documento_establecimiento_punto_emision: {
                    empresa_id: empresaId,
                    tipo_documento: tipo,
                    establecimiento,
                    punto_emision
                }
            },
            update: {
                secuencial: { increment: 1 }
            },
            create: {
                empresa_id: empresaId,
                tipo_documento: tipo,
                establecimiento,
                punto_emision,
                secuencial: 1
            }
        })
        return doc.secuencial
    }

    // Usar el cliente proporcionado o iniciar una nueva transacción
    const result = txClient
        ? await operation(txClient)
        : await prisma.$transaction(async (tx) => await operation(tx))


    const seqStr = result.toString().padStart(9, '0')
    const numero = prefix
        ? `${prefix}-${establecimiento}-${seqStr}` // VTA-001-000000123
        : `${establecimiento}-${puntoEmision}-${seqStr}` // 001-001-000000123 (Formato SRI)

    return { numero, secuencial: result }
}
