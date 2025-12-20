// QR Code Generator Utility
import QRCode from 'qrcode'

export interface QRGeneratorOptions {
    width?: number
    margin?: number
    color?: {
        dark?: string
        light?: string
    }
}

export async function generateQRCode(
    data: string,
    options: QRGeneratorOptions = {}
): Promise<string> {
    const defaultOptions = {
        width: 200,
        margin: 2,
        color: {
            dark: '#1e3a5f',
            light: '#ffffff',
        },
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: mergedOptions.width,
            margin: mergedOptions.margin,
            color: mergedOptions.color,
            errorCorrectionLevel: 'M',
        })
        return qrDataUrl
    } catch (error) {
        console.error('Error generating QR code:', error)
        throw error
    }
}

export function generateTrackingUrl(ordenId: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${base}/tracking/${ordenId}`
}

export async function generateOrderQR(
    ordenId: string,
    baseUrl?: string
): Promise<{ qrDataUrl: string; trackingUrl: string }> {
    const trackingUrl = generateTrackingUrl(ordenId, baseUrl)
    const qrDataUrl = await generateQRCode(trackingUrl)

    return {
        qrDataUrl,
        trackingUrl,
    }
}
