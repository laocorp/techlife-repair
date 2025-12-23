import { readFile } from 'fs/promises'
import { signXML } from './xml-signer'

const SRI_URLS = {
    pruebas: {
        recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
        autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
    },
    produccion: {
        recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
        autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
    }
}

interface SriResponse {
    estado: string // 'RECIBIDA' | 'DEVUELTA' | 'AUTORIZADO' | 'NO AUTORIZADO'
    claveAcceso?: string
    numeroAutorizacion?: string
    fechaAutorizacion?: string
    mensajes: Array<{
        identificador: string
        mensaje: string
        informacionAdicional?: string
        tipo: string // 'ERROR' | 'ADVERTENCIA'
    }>
}

export class SriService {

    /**
     * Signs the XML utilizing the stored P12 certificate
     */
    static async signInvoice(xml: string, p12Path: string, password: string): Promise<string> {
        try {
            const p12Buffer = await readFile(p12Path)
            const signedXml = signXML(xml, p12Buffer.buffer as ArrayBuffer, password)
            return signedXml
        } catch (error) {
            console.error('Error signing invoice:', error)
            throw new Error('Error al firmar la factura electrónica')
        }
    }

    /**
     * Sends the signed XML to SRI Recepcion service
     */
    static async enviarComprobante(xmlSigned: string, ambiente: 'pruebas' | 'produccion'): Promise<SriResponse> {
        const url = SRI_URLS[ambiente].recepcion
        const xmlBase64 = Buffer.from(xmlSigned).toString('base64')

        const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${xmlBase64}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                body: soapEnvelope
            })

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`)
            }

            const text = await response.text()
            return this.parseRecepcionResponse(text)

        } catch (error: any) {
            console.error('SRI Recepcion Error:', error)
            throw new Error(`Error de comunicación con SRI: ${error.message}`)
        }
    }

    /**
     * Check authorization status
     */
    static async autorizarComprobante(claveAcceso: string, ambiente: 'pruebas' | 'produccion'): Promise<SriResponse> {
        const url = SRI_URLS[ambiente].autorizacion

        const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:autorizacionComprobante>
         <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
      </ec:autorizacionComprobante>
   </soapenv:Body>
</soapenv:Envelope>`

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                body: soapEnvelope
            })

            const text = await response.text()
            return this.parseAutorizacionResponse(text)

        } catch (error: any) {
            console.error('SRI Autorizacion Error:', error)
            throw new Error(`Error de comunicación con SRI: ${error.message}`)
        }
    }

    private static parseRecepcionResponse(xml: string): SriResponse {
        // Simple regex parsing for MVP. In production, use a real XML parser like 'fast-xml-parser'
        const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/)
        const estado = estadoMatch ? estadoMatch[1] : 'UNKNOWN'

        const mensajes: SriResponse['mensajes'] = []

        // Match all messages
        const mensajeRegex = /<mensaje>([\s\S]*?)<\/mensaje>/g
        let match
        while ((match = mensajeRegex.exec(xml)) !== null) {
            const content = match[1]
            const id = content.match(/<identificador>(.*?)<\/identificador>/)?.[1] || ''
            const msg = content.match(/<mensaje>(.*?)<\/mensaje>/)?.[1] || ''
            const info = content.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/)?.[1]
            const type = content.match(/<tipo>(.*?)<\/tipo>/)?.[1] || 'INFO'

            mensajes.push({
                identificador: id,
                mensaje: msg,
                informacionAdicional: info,
                tipo: type
            })
        }

        return {
            estado,
            mensajes
        }
    }

    private static parseAutorizacionResponse(xml: string): SriResponse {
        // Regex parsing
        const estadoMatch = xml.match(/<estado>(.*?)<\/estado>/)
        const estado = estadoMatch ? estadoMatch[1] : 'UNKNOWN'

        const numeroAutorizacion = xml.match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/)?.[1]
        const fechaAutorizacion = xml.match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/)?.[1]

        const mensajes: SriResponse['mensajes'] = []

        // Match all messages
        const mensajeRegex = /<mensaje>([\s\S]*?)<\/mensaje>/g
        let match
        while ((match = mensajeRegex.exec(xml)) !== null) {
            const content = match[1]
            const id = content.match(/<identificador>(.*?)<\/identificador>/)?.[1] || ''
            const msg = content.match(/<mensaje>(.*?)<\/mensaje>/)?.[1] || ''
            const info = content.match(/<informacionAdicional>(.*?)<\/informacionAdicional>/)?.[1]
            const type = content.match(/<tipo>(.*?)<\/tipo>/)?.[1] || 'INFO'

            mensajes.push({
                identificador: id,
                mensaje: msg,
                informacionAdicional: info,
                tipo: type
            })
        }

        return {
            estado,
            numeroAutorizacion,
            fechaAutorizacion,
            mensajes
        }
    }
}
