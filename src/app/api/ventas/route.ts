
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFacturaXML, getIVACodigoPorcentaje, validateRUC, validateCedula, DatosEmisor, DatosComprador, InfoFactura, DetalleFactura, FacturaXMLOptions } from '@/lib/sri/xml-generator'
import { signXML } from '@/lib/sri/xml-signer'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            empresa_id,
            usuario_id,
            cliente_id,
            items,
            subtotal,
            iva,
            descuento,
            total,
            metodo_pago
        } = body

        if (!empresa_id || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Datos incompletos para la venta' },
                { status: 400 }
            )
        }

        // 1. Transaction: Create Sale + Update Stock
        const result = await prisma.$transaction(async (tx) => {
            // A. Get Sequential Number for Invoice
            const secuencialDoc = await tx.secuencial.findFirst({
                where: {
                    empresa_id,
                    tipo_documento: 'factura'
                }
            })

            let numeroFactura = `VTA-${Date.now()}` // Fallback
            let establecimiento = '001'
            let punto_emision = '001'
            let secuencial = 1

            if (secuencialDoc) {
                establecimiento = secuencialDoc.establecimiento
                punto_emision = secuencialDoc.punto_emision
                secuencial = secuencialDoc.secuencial
                numeroFactura = `${establecimiento}-${punto_emision}-${secuencial.toString().padStart(9, '0')}`

                // Increment sequential
                await tx.secuencial.update({
                    where: { id: secuencialDoc.id },
                    data: { secuencial: { increment: 1 } }
                })
            }

            // B. Check Stock
            for (const item of items) {
                const producto = await tx.producto.findUnique({
                    where: { id: item.producto_id }
                })

                if (!producto) throw new Error(`Producto ${item.producto_id} no encontrado`)
                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre} (Disponible: ${producto.stock})`)
                }

                // Decrement Stock
                await tx.producto.update({
                    where: { id: item.producto_id },
                    data: { stock: { decrement: item.cantidad } }
                })
            }

            // C. Create Sale Record
            const venta = await tx.venta.create({
                data: {
                    numero: numeroFactura,
                    empresa_id,
                    cliente_id, // Can be null (Consumidor Final)
                    subtotal,
                    iva,
                    descuento,
                    total,
                    metodo_pago,
                    estado: 'completada',
                    created_at: new Date(),
                    detalles: {
                        create: items.map((item: any) => ({
                            producto_id: item.producto_id,
                            cantidad: item.cantidad,
                            precio_unitario: item.precio_unitario,
                            subtotal: item.subtotal
                        }))
                    }
                },
                include: {
                    cliente: true,
                    empresa: true
                }
            })

            // D. Create Caja Movimiento (Ingreso)
            // Find open box for user or generic
            const caja = await tx.caja.findFirst({
                where: {
                    empresa_id: empresa_id,
                    estado: 'abierta'
                    // Ideally filter by user too, but taking any open box for now
                }
            })

            if (caja) {
                await tx.cajaMovimiento.create({
                    data: {
                        caja_id: caja.id,
                        tipo: 'ingreso',
                        monto: total,
                        concepto: `Venta #${numeroFactura} (${metodo_pago})`
                    }
                })
            }

            return { venta, secuencialData: { establecimiento, punto_emision, secuencial } }
        })

        const { venta, secuencialData } = result

        // 2. SRI Integration (XML Generation & Signing)
        // This is done OUTSIDE the transaction to not block it if SRI fails, 
        // but typically we want it to be part of the flow.
        // We will Try-Catch it purely for the Invoice generation part.

        try {
            const empresa = venta.empresa

            // Check if we can generate invoice
            if (empresa.certificado_p12_url && empresa.certificado_password) {

                // --- PREPARE DATA ---

                // Emisor
                const datosEmisor: DatosEmisor = {
                    ruc: empresa.ruc || '9999999999999',
                    razonSocial: empresa.razon_social || empresa.nombre,
                    nombreComercial: empresa.nombre_comercial || empresa.nombre,
                    direccionMatriz: empresa.direccion || 'S/N',
                    obligadoContabilidad: empresa.obligado_contabilidad
                }

                // Comprador
                let datosComprador: DatosComprador
                if (venta.cliente) {
                    let tipoId = '07' // Consumidor Final default
                    if (venta.cliente.tipo_id === 'ruc') tipoId = '04'
                    if (venta.cliente.tipo_id === 'cedula') tipoId = '05'
                    if (venta.cliente.tipo_id === 'pasaporte') tipoId = '06'

                    datosComprador = {
                        tipoIdentificacion: tipoId as any,
                        identificacion: venta.cliente.identificacion || '9999999999999',
                        razonSocial: venta.cliente.nombre,
                        direccion: venta.cliente.direccion || undefined,
                        email: venta.cliente.email || undefined,
                        telefono: venta.cliente.telefono || undefined
                    }
                } else {
                    datosComprador = {
                        tipoIdentificacion: '07', // Consumidor Final
                        identificacion: '9999999999999',
                        razonSocial: 'CONSUMIDOR FINAL'
                    }
                }

                // Info Factura
                const infoFactura: InfoFactura = {
                    fechaEmision: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    dirEstablecimiento: empresa.direccion || 'S/N',
                    obligadoContabilidad: empresa.obligado_contabilidad ? 'SI' : 'NO',
                    tipoIdentificacionComprador: datosComprador.tipoIdentificacion,
                    razonSocialComprador: datosComprador.razonSocial,
                    identificacionComprador: datosComprador.identificacion,
                    direccionComprador: datosComprador.direccion,
                    totalSinImpuestos: Number(venta.subtotal),
                    totalDescuento: Number(venta.descuento),
                    // Assuming all items are 15% IVA for simplicity in this MVP, 
                    // or deriving from items. Ideally items should carry their tax code.
                    totalConImpuestos: [{
                        codigo: '2', // IVA
                        codigoPorcentaje: '4', // 15%
                        baseImponible: Number(venta.subtotal),
                        valor: Number(venta.iva)
                    }],
                    propina: 0,
                    importeTotal: Number(venta.total),
                    moneda: 'DOLAR'
                }

                // Detalles
                const detalles: DetalleFactura[] = items.map((item: any) => ({
                    codigoPrincipal: item.producto_id.slice(0, 10), // Truncate UUID
                    descripcion: item.descripcion,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio_unitario,
                    descuento: 0, // Simplified
                    precioTotalSinImpuesto: item.subtotal,
                    impuestos: [{
                        codigo: '2', // IVA
                        codigoPorcentaje: '4', // 15%
                        baseImponible: item.subtotal,
                        tarifa: 15,
                        valor: item.iva
                    }]
                }))

                // Generate XML
                const xmlOptions: FacturaXMLOptions = {
                    ambiente: empresa.ambiente_sri === 'produccion' ? '2' : '1',
                    tipoEmision: '1', // Normal
                    establecimiento: secuencialData.establecimiento,
                    puntoEmision: secuencialData.punto_emision,
                    secuencial: secuencialData.secuencial
                }

                const xmlUnsigned = generateFacturaXML(datosEmisor, datosComprador, infoFactura, detalles, xmlOptions)

                // Sign XML - Need to fetch P12 file from URL (simulated fetch or FS)
                // In a real app with S3/Storage, we download it. 
                // For this MVP, if it's a file path we read it, if it's external URL we fetch.
                // Assuming it might be stored locally or we skip real signing if file not found to prevent crash.
                /* 
                   NOTE: Loading P12 from URL/Path is complex here without knowing storage backend.
                   If it's just a demo path, we might fail.
                   We'll store the UNsigned XML if signing fails, or just the XML.
                */

                // Saving the record regardless of signing success for now
                await prisma.facturacionElectronica.create({
                    data: {
                        empresa_id: empresa.id,
                        venta_id: venta.id, // Need to add relation to schema if not exists, or just link by ID
                        clave_acceso: xmlUnsigned.match(/<claveAcceso>(.*?)<\/claveAcceso>/)?.[1] || '',
                        numero_autorizacion: null,
                        estado: 'GENERADO', // Not sent yet
                        xml_generado: xmlUnsigned,
                        ambiente: empresa.ambiente_sri
                    }
                })
            }

        } catch (sriError) {
            console.error('Error generating SRI invoice:', sriError)
            // We do NOT fail the sale if SRI fails, we just log it. 
            // The sale is valid, the invoice can be retried later.
        }

        return NextResponse.json(venta)

    } catch (error: any) {
        console.error('Error creating sale:', error)
        return NextResponse.json(
            { error: error.message || 'Error al procesar la venta' },
            { status: 500 }
        )
    }
}
