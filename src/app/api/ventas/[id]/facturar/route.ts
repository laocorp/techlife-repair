
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFacturaXML, DatosEmisor, DatosComprador, InfoFactura, DetalleFactura, FacturaXMLOptions } from '@/lib/sri/xml-generator'
import { SriService } from '@/lib/sri/sri-service'
import { getNextSecuencial } from '@/lib/secuenciales'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const ventaId = params.id

        // 1. Get Sale
        const venta = await prisma.venta.findUnique({
            where: { id: ventaId },
            include: {
                empresa: true,
                cliente: true,
                factura: true,
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        })

        if (!venta) {
            return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
        }

        if (venta.factura) {
            return NextResponse.json({ error: 'Esta venta ya tiene factura electrónica', factura: venta.factura }, { status: 400 })
        }

        const empresa = venta.empresa

        if (!empresa.certificado_p12_url || !empresa.certificado_password) {
            return NextResponse.json({ error: 'La empresa no tiene firma electrónica configurada' }, { status: 400 })
        }

        // 2. Get Sequential (Factura)
        // We need a NEW sequential for the Invoice document type
        const { numero, secuencial } = await getNextSecuencial(
            empresa.id,
            'factura',
            '001', // Should ideal come from stored preference or sale, assuming 001 for now
            '001'
        )

        // Note: The 'Venta' already has a number (e.g. VTA-...). The Invoice will have its own SRI number e.g. 001-001-....
        // We store this new number in FacturacionElectronica record.
        const establecimiento = numero.split('-')[0]
        const punto_emision = numero.split('-')[1]


        // 3. Prepare SRI Data
        const datosEmisor: DatosEmisor = {
            ruc: empresa.ruc || '9999999999999',
            razonSocial: empresa.razon_social || empresa.nombre,
            nombreComercial: empresa.nombre_comercial || empresa.nombre,
            direccionMatriz: empresa.direccion || 'S/N',
            obligadoContabilidad: empresa.obligado_contabilidad
        }

        let datosComprador: DatosComprador
        if (venta.cliente) {
            let tipoId = '07'
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
                tipoIdentificacion: '07',
                identificacion: '9999999999999',
                razonSocial: 'CONSUMIDOR FINAL'
            }
        }

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
            totalConImpuestos: [{
                codigo: '2',
                codigoPorcentaje: '4', // 15% - Should match original sale logic
                baseImponible: Number(venta.subtotal),
                valor: Number(venta.iva)
            }],
            propina: 0,
            importeTotal: Number(venta.total),
            moneda: 'DOLAR'
        }

        const detalles: DetalleFactura[] = venta.detalles.map((detalle) => ({
            codigoPrincipal: detalle.producto_id.slice(0, 10),
            descripcion: detalle.producto?.nombre || 'Producto',
            cantidad: detalle.cantidad,
            precioUnitario: Number(detalle.precio_unitario),
            descuento: 0,
            precioTotalSinImpuesto: Number(detalle.subtotal),
            impuestos: [{
                codigo: '2',
                codigoPorcentaje: '4',
                baseImponible: Number(detalle.subtotal),
                tarifa: 15,
                valor: (Number(detalle.subtotal) * 0.15) // Re-calculate or store? ideally store, but for now calc
            }]
        }))

        const xmlOptions: FacturaXMLOptions = {
            ambiente: empresa.ambiente_sri === 'produccion' ? '2' : '1',
            tipoEmision: '1',
            establecimiento,
            puntoEmision: punto_emision,
            secuencial
        }

        const xmlUnsigned = generateFacturaXML(datosEmisor, datosComprador, infoFactura, detalles, xmlOptions)

        // 4. Sign and Send
        let xmlSigned = xmlUnsigned
        let estadoFactura = 'GENERADO'
        let numeroAutorizacion = null
        let sriResponseMessages: any[] = []

        try {
            xmlSigned = await SriService.signInvoice(
                xmlUnsigned,
                empresa.certificado_p12_url,
                empresa.certificado_password
            )
            estadoFactura = 'FIRMADO'

            const recepcionParam = empresa.ambiente_sri === 'produccion' ? 'produccion' : 'pruebas'
            const recepcionResponse = await SriService.enviarComprobante(xmlSigned, recepcionParam)

            if (recepcionResponse.estado === 'RECIBIDA') {
                estadoFactura = 'EN_PROCESO'
                await new Promise(resolve => setTimeout(resolve, 3000))

                const claveAcceso = xmlUnsigned.match(/<claveAcceso>(.*?)<\/claveAcceso>/)?.[1] || ''
                const authResponse = await SriService.autorizarComprobante(claveAcceso, recepcionParam)

                if (authResponse.estado === 'AUTORIZADO') {
                    estadoFactura = 'AUTORIZADO'
                    numeroAutorizacion = authResponse.numeroAutorizacion
                } else {
                    estadoFactura = authResponse.estado
                    sriResponseMessages = authResponse.mensajes
                }
            } else {
                estadoFactura = recepcionResponse.estado
                sriResponseMessages = recepcionResponse.mensajes
            }
        } catch (error) {
            console.error('SRI Error:', error)
            estadoFactura = 'ERROR_ENVIO'
        }

        // 5. Create Record
        const factura = await prisma.facturacionElectronica.create({
            data: {
                empresa_id: empresa.id,
                venta_id: venta.id,
                // numero: venta.numero, // REMOVED duplicate key
                numero: numero, // Using SRI Number (001-001-...)

                tipo_comprobante: '01',
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

        return NextResponse.json({
            success: true,
            estado: estadoFactura,
            mensajes: sriResponseMessages,
            factura
        })

    } catch (error: any) {
        console.error('Error procesando factura:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
