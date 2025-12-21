// src/lib/sri/xml-signer.ts
// XML Digital Signature for SRI Ecuador - XAdES-BES Format

import * as forge from 'node-forge'

/**
 * P12 Certificate Information
 */
export interface P12Info {
    certificate: forge.pki.Certificate
    privateKey: forge.pki.PrivateKey
    commonName: string
    serialNumber: string
    issuer: string
    validFrom: Date
    validTo: Date
    isValid: boolean
}

/**
 * Parse a P12/PFX file and extract certificate information
 */
export function parseP12(p12Buffer: ArrayBuffer, password: string): P12Info {
    try {
        // Convert ArrayBuffer to forge buffer
        const p12Der = forge.util.createBuffer(new Uint8Array(p12Buffer))
        const p12Asn1 = forge.asn1.fromDer(p12Der)
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

        // Get certificate and private key
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

        const certBag = certBags[forge.pki.oids.certBag]?.[0]
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

        if (!certBag?.cert || !keyBag?.key) {
            throw new Error('No se encontró certificado o clave privada en el archivo P12')
        }

        const cert = certBag.cert
        const privateKey = keyBag.key as forge.pki.PrivateKey

        // Extract certificate info
        const commonName = cert.subject.getField('CN')?.value || 'Unknown'
        const serialNumber = cert.serialNumber
        const issuer = cert.issuer.getField('CN')?.value || 'Unknown'
        const validFrom = cert.validity.notBefore
        const validTo = cert.validity.notAfter
        const now = new Date()
        const isValid = now >= validFrom && now <= validTo

        return {
            certificate: cert,
            privateKey,
            commonName,
            serialNumber,
            issuer,
            validFrom,
            validTo,
            isValid,
        }
    } catch (error: any) {
        if (error.message?.includes('Invalid password')) {
            throw new Error('Contraseña del certificado incorrecta')
        }
        throw new Error(`Error al procesar certificado P12: ${error.message}`)
    }
}

/**
 * Check if certificate is valid (not expired)
 */
export function isCertificateValid(info: P12Info): boolean {
    const now = new Date()
    return now >= info.validFrom && now <= info.validTo
}

/**
 * Get certificate expiry days remaining
 */
export function getCertificateExpiryDays(info: P12Info): number {
    const now = new Date()
    const diffTime = info.validTo.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Generate SHA-1 hash (required for XAdES-BES)
 */
function sha1(data: string): string {
    const md = forge.md.sha1.create()
    md.update(data, 'utf8')
    return md.digest().toHex()
}

/**
 * Generate SHA-256 hash
 */
function sha256(data: string): string {
    const md = forge.md.sha256.create()
    md.update(data, 'utf8')
    return md.digest().toHex()
}

/**
 * Convert hex to Base64
 */
function hexToBase64(hex: string): string {
    const bytes = forge.util.hexToBytes(hex)
    return forge.util.encode64(bytes)
}

/**
 * Get certificate in Base64 format
 */
function getCertificateBase64(cert: forge.pki.Certificate): string {
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert))
    return forge.util.encode64(certDer.getBytes())
}

/**
 * Sign data with private key using SHA-1 with RSA
 */
function signData(data: string, privateKey: forge.pki.PrivateKey): string {
    const md = forge.md.sha1.create()
    md.update(data, 'utf8')
    // Cast to RSA private key to access sign method
    const rsaPrivateKey = privateKey as forge.pki.rsa.PrivateKey
    const signature = rsaPrivateKey.sign(md)
    return forge.util.encode64(signature)
}

/**
 * Generate ISO 8601 timestamp for XAdES
 */
function getISOTimestamp(): string {
    return new Date().toISOString()
}

/**
 * Generate a random ID for XML elements
 */
function generateId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Canonicalize XML (C14N) - Simple implementation
 * For SRI Ecuador, we use exclusive canonicalization
 */
function canonicalizeXml(xml: string): string {
    // Remove XML declaration
    let canonical = xml.replace(/<\?xml[^?]*\?>/gi, '')

    // Normalize whitespace between tags
    canonical = canonical.replace(/>\s+</g, '><')

    // Trim
    canonical = canonical.trim()

    return canonical
}

/**
 * Sign XML with XAdES-BES format for SRI Ecuador
 * 
 * @param xml - The unsigned XML document
 * @param p12Buffer - The P12/PFX certificate file as ArrayBuffer
 * @param password - The certificate password
 * @returns Signed XML string
 */
export function signXML(xml: string, p12Buffer: ArrayBuffer, password: string): string {
    const p12Info = parseP12(p12Buffer, password)

    if (!p12Info.isValid) {
        throw new Error(`El certificado expiró el ${p12Info.validTo.toLocaleDateString()}`)
    }

    // Generate IDs for XML elements
    const signatureId = generateId('Signature')
    const signedInfoId = generateId('SignedInfo')
    const signedPropertiesId = generateId('SignedProperties')
    const keyInfoId = generateId('KeyInfo')
    const referenceId = generateId('Reference')
    const objectId = generateId('Object')

    // Get certificate in Base64
    const certBase64 = getCertificateBase64(p12Info.certificate)

    // Calculate certificate digest (SHA-1)
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(p12Info.certificate)).getBytes()
    const certDigest = hexToBase64(sha1(certDer))

    // Get signing time
    const signingTime = getISOTimestamp()

    // Canonicalize the document (without signature)
    const canonicalDoc = canonicalizeXml(xml)

    // Calculate document digest
    const docDigest = hexToBase64(sha1(canonicalDoc))

    // Build SignedProperties
    const signedProperties = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signedPropertiesId}">
<xades:SignedSignatureProperties>
<xades:SigningTime>${signingTime}</xades:SigningTime>
<xades:SigningCertificate>
<xades:Cert>
<xades:CertDigest>
<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<ds:DigestValue>${certDigest}</ds:DigestValue>
</xades:CertDigest>
<xades:IssuerSerial>
<ds:X509IssuerName>${p12Info.issuer}</ds:X509IssuerName>
<ds:X509SerialNumber>${parseInt(p12Info.serialNumber, 16)}</ds:X509SerialNumber>
</xades:IssuerSerial>
</xades:Cert>
</xades:SigningCertificate>
</xades:SignedSignatureProperties>
<xades:SignedDataObjectProperties>
<xades:DataObjectFormat ObjectReference="#${referenceId}">
<xades:Description>Contenido comprobante</xades:Description>
<xades:MimeType>text/xml</xades:MimeType>
</xades:DataObjectFormat>
</xades:SignedDataObjectProperties>
</xades:SignedProperties>`

    // Calculate SignedProperties digest
    const signedPropsDigest = hexToBase64(sha1(canonicalizeXml(signedProperties)))

    // Build SignedInfo
    const signedInfo = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${signedInfoId}">
<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<ds:Reference Id="${referenceId}" URI="#comprobante">
<ds:Transforms>
<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
</ds:Transforms>
<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<ds:DigestValue>${docDigest}</ds:DigestValue>
</ds:Reference>
<ds:Reference URI="#${signedPropertiesId}" Type="http://uri.etsi.org/01903#SignedProperties">
<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<ds:DigestValue>${signedPropsDigest}</ds:DigestValue>
</ds:Reference>
</ds:SignedInfo>`

    // Sign the SignedInfo
    const signedInfoCanonical = canonicalizeXml(signedInfo)
    const signatureValue = signData(signedInfoCanonical, p12Info.privateKey)

    // Build KeyInfo
    const keyInfo = `<ds:KeyInfo Id="${keyInfoId}">
<ds:X509Data>
<ds:X509Certificate>${certBase64}</ds:X509Certificate>
</ds:X509Data>
<ds:KeyValue>
<ds:RSAKeyValue>
<ds:Modulus>${forge.util.encode64(forge.util.hexToBytes((p12Info.certificate.publicKey as forge.pki.rsa.PublicKey).n.toString(16)))}</ds:Modulus>
<ds:Exponent>${forge.util.encode64(forge.util.hexToBytes((p12Info.certificate.publicKey as forge.pki.rsa.PublicKey).e.toString(16)))}</ds:Exponent>
</ds:RSAKeyValue>
</ds:KeyValue>
</ds:KeyInfo>`

    // Build complete Signature element
    const signature = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">
${signedInfo.replace('xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" ', '')}
<ds:SignatureValue>${signatureValue}</ds:SignatureValue>
${keyInfo}
<ds:Object Id="${objectId}">
<xades:QualifyingProperties Target="#${signatureId}">
${signedProperties.replace('xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" ', '')}
</xades:QualifyingProperties>
</ds:Object>
</ds:Signature>`

    // Insert signature before closing tag of root element
    const rootCloseTagMatch = xml.match(/<\/[^>]+>\s*$/)
    if (!rootCloseTagMatch) {
        throw new Error('No se encontró la etiqueta de cierre del documento XML')
    }

    const insertPosition = xml.lastIndexOf(rootCloseTagMatch[0])
    const signedXml = xml.substring(0, insertPosition) + signature + '\n' + xml.substring(insertPosition)

    return signedXml
}

/**
 * Validate P12 certificate (check password and extract info)
 */
export async function validateP12Certificate(
    p12Buffer: ArrayBuffer,
    password: string
): Promise<{
    valid: boolean
    info?: P12Info
    error?: string
}> {
    try {
        const info = parseP12(p12Buffer, password)
        return {
            valid: true,
            info,
        }
    } catch (error: any) {
        return {
            valid: false,
            error: error.message,
        }
    }
}
