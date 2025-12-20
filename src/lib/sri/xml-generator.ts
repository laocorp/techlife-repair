// src/lib/sri/xml-generator.ts
// XML Generator for SRI Ecuador Electronic Invoices

/**
 * Generates XML for electronic invoices according to SRI Ecuador XSD v2.28
 * Reference: https://www.sri.gob.ec/esquemas-de-comprobantes-electronicos
 */

export interface DatosEmisor {
    ruc: string
    razonSocial: string
    nombreComercial?: string
    direccionMatriz: string
    contribuyenteEspecial?: string
    obligadoContabilidad: boolean
}

export interface DatosComprador {
    tipoIdentificacion: '04' | '05' | '06' | '07' | '08' // 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final, 08=Identificación Exterior
    identificacion: string
    razonSocial: string
    direccion?: string
    email?: string
    telefono?: string
}

export interface DetalleFactura {
    codigoPrincipal: string
    codigoAuxiliar?: string
    descripcion: string
    cantidad: number
    precioUnitario: number
    descuento: number
    precioTotalSinImpuesto: number
    impuestos: {
        codigo: string // 2=IVA
        codigoPorcentaje: string // 0=0%, 2=12%, 3=14%, 4=15%, 6=No Objeto, 7=Exento
        baseImponible: number
        tarifa: number
        valor: number
    }[]
}

export interface InfoFactura {
    fechaEmision: string // dd/mm/yyyy
    dirEstablecimiento?: string
    contribuyenteEspecial?: string
    obligadoContabilidad: 'SI' | 'NO'
    tipoIdentificacionComprador: string
    razonSocialComprador: string
    identificacionComprador: string
    direccionComprador?: string
    totalSinImpuestos: number
    totalDescuento: number
    totalConImpuestos: {
        codigo: string
        codigoPorcentaje: string
        baseImponible: number
        valor: number
    }[]
    propina: number
    importeTotal: number
    moneda: string
}

export interface FacturaXMLOptions {
    ambiente: '1' | '2' // 1=Pruebas, 2=Producción
    tipoEmision: '1' | '2' // 1=Normal, 2=Contingencia
    establecimiento: string
    puntoEmision: string
    secuencial: number
    claveAcceso?: string
}

/**
 * Generate the access key (clave de acceso) for SRI
 * 49 digits according to SRI specification
 */
export function generateClaveAcceso(
    fechaEmision: string, // dd/mm/yyyy
    tipoComprobante: string, // 01=Factura, 04=Nota Crédito, etc.
    ruc: string,
    ambiente: '1' | '2',
    establecimiento: string,
    puntoEmision: string,
    secuencial: number,
    codigoNumerico: string = '12345678', // 8 digits
    tipoEmision: '1' | '2' = '1'
): string {
    // Remove slashes from date: ddmmyyyy
    const fecha = fechaEmision.replace(/\//g, '')

    // Pad secuencial to 9 digits
    const secuencialPadded = secuencial.toString().padStart(9, '0')

    // Build access key without check digit (48 digits)
    const claveBase =
        fecha +                    // 8: ddmmyyyy
        tipoComprobante +          // 2: tipo comprobante
        ruc +                      // 13: RUC
        ambiente +                 // 1: ambiente
        establecimiento +          // 3: establecimiento
        puntoEmision +             // 3: punto emisión
        secuencialPadded +         // 9: secuencial
        codigoNumerico +           // 8: código numérico
        tipoEmision                // 1: tipo emisión

    // Calculate check digit (modulo 11)
    const checkDigit = calculateModulo11(claveBase)

    return claveBase + checkDigit
}

/**
 * Calculate modulo 11 check digit (SRI algorithm)
 */
function calculateModulo11(value: string): string {
    const weights = [2, 3, 4, 5, 6, 7]
    let sum = 0
    let weightIndex = 0

    // Iterate from right to left
    for (let i = value.length - 1; i >= 0; i--) {
        sum += parseInt(value[i]) * weights[weightIndex]
        weightIndex = (weightIndex + 1) % weights.length
    }

    const remainder = sum % 11
    const checkDigit = 11 - remainder

    if (checkDigit === 11) return '0'
    if (checkDigit === 10) return '1'
    return checkDigit.toString()
}

/**
 * Format number for XML (2 decimal places, dot separator)
 */
function formatNumber(value: number): string {
    return value.toFixed(2)
}

/**
 * Generate XML for electronic invoice
 */
export function generateFacturaXML(
    emisor: DatosEmisor,
    comprador: DatosComprador,
    infoFactura: InfoFactura,
    detalles: DetalleFactura[],
    options: FacturaXMLOptions
): string {
    const claveAcceso = options.claveAcceso || generateClaveAcceso(
        infoFactura.fechaEmision,
        '01', // Factura
        emisor.ruc,
        options.ambiente,
        options.establecimiento,
        options.puntoEmision,
        options.secuencial
    )

    const numero = `${options.establecimiento}-${options.puntoEmision}-${options.secuencial.toString().padStart(9, '0')}`

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
    <infoTributaria>
        <ambiente>${options.ambiente}</ambiente>
        <tipoEmision>${options.tipoEmision}</tipoEmision>
        <razonSocial>${escapeXML(emisor.razonSocial)}</razonSocial>
        ${emisor.nombreComercial ? `<nombreComercial>${escapeXML(emisor.nombreComercial)}</nombreComercial>` : ''}
        <ruc>${emisor.ruc}</ruc>
        <claveAcceso>${claveAcceso}</claveAcceso>
        <codDoc>01</codDoc>
        <estab>${options.establecimiento}</estab>
        <ptoEmi>${options.puntoEmision}</ptoEmi>
        <secuencial>${options.secuencial.toString().padStart(9, '0')}</secuencial>
        <dirMatriz>${escapeXML(emisor.direccionMatriz)}</dirMatriz>
    </infoTributaria>
    <infoFactura>
        <fechaEmision>${infoFactura.fechaEmision}</fechaEmision>
        ${infoFactura.dirEstablecimiento ? `<dirEstablecimiento>${escapeXML(infoFactura.dirEstablecimiento)}</dirEstablecimiento>` : ''}
        ${emisor.contribuyenteEspecial ? `<contribuyenteEspecial>${emisor.contribuyenteEspecial}</contribuyenteEspecial>` : ''}
        <obligadoContabilidad>${infoFactura.obligadoContabilidad}</obligadoContabilidad>
        <tipoIdentificacionComprador>${infoFactura.tipoIdentificacionComprador}</tipoIdentificacionComprador>
        <razonSocialComprador>${escapeXML(infoFactura.razonSocialComprador)}</razonSocialComprador>
        <identificacionComprador>${infoFactura.identificacionComprador}</identificacionComprador>
        ${infoFactura.direccionComprador ? `<direccionComprador>${escapeXML(infoFactura.direccionComprador)}</direccionComprador>` : ''}
        <totalSinImpuestos>${formatNumber(infoFactura.totalSinImpuestos)}</totalSinImpuestos>
        <totalDescuento>${formatNumber(infoFactura.totalDescuento)}</totalDescuento>
        <totalConImpuestos>
            ${infoFactura.totalConImpuestos.map(imp => `
            <totalImpuesto>
                <codigo>${imp.codigo}</codigo>
                <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>
                <baseImponible>${formatNumber(imp.baseImponible)}</baseImponible>
                <valor>${formatNumber(imp.valor)}</valor>
            </totalImpuesto>`).join('')}
        </totalConImpuestos>
        <propina>${formatNumber(infoFactura.propina)}</propina>
        <importeTotal>${formatNumber(infoFactura.importeTotal)}</importeTotal>
        <moneda>${infoFactura.moneda}</moneda>
    </infoFactura>
    <detalles>
        ${detalles.map(det => `
        <detalle>
            <codigoPrincipal>${escapeXML(det.codigoPrincipal)}</codigoPrincipal>
            ${det.codigoAuxiliar ? `<codigoAuxiliar>${escapeXML(det.codigoAuxiliar)}</codigoAuxiliar>` : ''}
            <descripcion>${escapeXML(det.descripcion)}</descripcion>
            <cantidad>${formatNumber(det.cantidad)}</cantidad>
            <precioUnitario>${formatNumber(det.precioUnitario)}</precioUnitario>
            <descuento>${formatNumber(det.descuento)}</descuento>
            <precioTotalSinImpuesto>${formatNumber(det.precioTotalSinImpuesto)}</precioTotalSinImpuesto>
            <impuestos>
                ${det.impuestos.map(imp => `
                <impuesto>
                    <codigo>${imp.codigo}</codigo>
                    <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>
                    <tarifa>${formatNumber(imp.tarifa)}</tarifa>
                    <baseImponible>${formatNumber(imp.baseImponible)}</baseImponible>
                    <valor>${formatNumber(imp.valor)}</valor>
                </impuesto>`).join('')}
            </impuestos>
        </detalle>`).join('')}
    </detalles>
</factura>`

    return xml.trim()
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

/**
 * Get IVA code based on percentage
 */
export function getIVACodigoPorcentaje(porcentaje: number): string {
    switch (porcentaje) {
        case 0: return '0'
        case 12: return '2'
        case 14: return '3'
        case 15: return '4'
        default: return '4' // Default to 15%
    }
}

/**
 * Validate RUC (Registro Único de Contribuyentes)
 */
export function validateRUC(ruc: string): boolean {
    if (!ruc || ruc.length !== 13) return false
    if (!/^\d{13}$/.test(ruc)) return false

    const provincia = parseInt(ruc.substring(0, 2))
    if (provincia < 1 || provincia > 24) return false

    const tercerDigito = parseInt(ruc[2])
    if (tercerDigito < 0 || tercerDigito > 9) return false

    // Last 3 digits must be 001 for natural persons
    // or can vary for companies

    return true
}

/**
 * Validate Cédula de Identidad
 */
export function validateCedula(cedula: string): boolean {
    if (!cedula || cedula.length !== 10) return false
    if (!/^\d{10}$/.test(cedula)) return false

    const provincia = parseInt(cedula.substring(0, 2))
    if (provincia < 1 || provincia > 24) return false

    const tercerDigito = parseInt(cedula[2])
    if (tercerDigito > 5) return false

    // Verify check digit
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    let sum = 0

    for (let i = 0; i < 9; i++) {
        let product = parseInt(cedula[i]) * coefficients[i]
        if (product >= 10) product -= 9
        sum += product
    }

    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit === parseInt(cedula[9])
}
