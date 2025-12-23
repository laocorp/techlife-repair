
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFacturaXML, getIVACodigoPorcentaje, validateRUC, validateCedula, DatosEmisor, DatosComprador, InfoFactura, DetalleFactura, FacturaXMLOptions } from '@/lib/sri/xml-generator'
import { signXML } from '@/lib/sri/xml-signer'
import { SriService } from '@/lib/sri/sri-service'

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
        const result = await prisma.$transaction(async (tx: any) => {
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

                // Sign XML
                let xmlSigned = xmlUnsigned
                let estadoFactura = 'GENERADO'
                let numeroAutorizacion = null
                let fechaAutorizacion = null
                let sriResponseMessages: any[] = []

                try {
                    // 1. Sign
                    console.log('Signing invoice...')
                    // Ensure path is correct. If it was stored relative to project root, simple join might work.
                    // But if it's absolute (as stored in certificate route), verify access.
                    // route.ts stored it as `path.join(uploadDir, fileName)` which is absolute process.cwd()/...
                    xmlSigned = await SriService.signInvoice(
                        xmlUnsigned,
                        empresa.certificado_p12_url,
                        empresa.certificado_password
                    )
                    estadoFactura = 'FIRMADO'

                    // 2. Send to SRI (Recepcion)
                    console.log('Sending to SRI Recepcion...')
                    const recepcionParam = empresa.ambiente_sri === 'produccion' ? 'produccion' : 'pruebas'
                    const recepcionResponse = await SriService.enviarComprobante(xmlSigned, recepcionParam)

                    if (recepcionResponse.estado === 'RECIBIDA') {
                        estadoFactura = 'EN_PROCESO'

                        // 3. Authorize (Autorizacion)
                        // SRI usually needs a small delay or retry, but for MVP request immediately
                        console.log('Requesting Authorization...')
                        // Small delay to ensure SRI processed it
                        await new Promise(resolve => setTimeout(resolve, 3000))

                        const claveAcceso = xmlUnsigned.match(/<claveAcceso>(.*?)<\/claveAcceso>/)?.[1] || ''
                        const authResponse = await SriService.autorizarComprobante(claveAcceso, recepcionParam)

                        if (authResponse.estado === 'AUTORIZADO') {
                            estadoFactura = 'AUTORIZADO'
                            numeroAutorizacion = authResponse.numeroAutorizacion
                            // fechaAutorizacion = authResponse.fechaAutorizacion // Handle format if needed
                        } else {
                            estadoFactura = authResponse.estado // RECHAZADO, NO AUTORIZADO
                            sriResponseMessages = authResponse.mensajes
                        }
                    } else {
                        estadoFactura = recepcionResponse.estado // DEVUELTA
                        sriResponseMessages = recepcionResponse.mensajes
                    }

                } catch (signingError) {
                    console.error('Error signing/sending invoice:', signingError)
                    // Keep generated but not signed/sent
                    estadoFactura = 'ERROR_ENVIO'
                }

                // Saving the record
                await prisma.facturacionElectronica.create({
                    data: {
                        empresa_id: empresa.id,
                        venta_id: venta.id,
                        numero: venta.numero, // Using Sale Number
                        tipo_comprobante: '01', // Factura

                        cliente_nombre: datosComprador.razonSocial,
                        cliente_identificacion: datosComprador.identificacion,

                        subtotal: venta.subtotal,
                        iva: venta.iva,
                        total: venta.total,

                        clave_acceso: xmlUnsigned.match(/<claveAcceso>(.*?)<\/claveAcceso>/)?.[1] || '',
                        numero_autorizacion: numeroAutorizacion,
                        estado: estadoFactura.toLowerCase(),
                        xml_generado: xmlSigned,
                        ambiente: empresa.ambiente_sri
                    } as any
                })

                if (sriResponseMessages.length > 0) {
                    console.log('SRI Messages:', sriResponseMessages)
                }
            }

        } catch (sriError) {
            console.error('Error in SRI workflow:', sriError)
            // We do NOT fail the sale if SRI fails.
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
