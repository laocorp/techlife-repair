export interface PayphoneConfig {
    token: string
    storeId: string
    region?: string
}

export interface CreateButtonRequest {
    amount: number
    amountWithoutTax: number
    currency: string
    clientTransactionId: string
    reference: string
    responseUrl: string
    cancellationUrl: string
}

export interface CreateButtonResponse {
    paymentId: number
    url: string
    status: string
}

export interface ConfirmPaymentResponse {
    email: string
    cardType: string
    bin: string
    lastDigits: string
    transactionStatus: string
    transactionId: number
    authorizationCode: string
    amount: number
    storeName: string
    clientTransactionId: string
    phoneNumber?: string
    document?: string
    optionalParameter4?: string
}

export class PayphoneClient {
    private config: PayphoneConfig
    private baseUrl: string

    constructor(config: PayphoneConfig) {
        this.config = config
        this.baseUrl = config.region || 'https://pay.payphonetodoesposible.com'
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.token}`
        }
    }

    async createLink(request: CreateButtonRequest): Promise<CreateButtonResponse> {
        // Using /api/button/Prepare
        const payload = {
            amount: request.amount,
            amountWithoutTax: request.amountWithoutTax,
            amountWithTax: 0,
            tax: 0,
            service: 0,
            tip: 0,
            currency: request.currency,
            clientTransactionId: request.clientTransactionId,
            reference: request.reference,
            responseUrl: request.responseUrl,
            cancellationUrl: request.cancellationUrl,
            storeId: this.config.storeId,
        }

        console.log('Payphone Config Check:', {
            hasToken: !!this.config.token,
            storeId: this.config.storeId,
            baseUrl: this.baseUrl
        })
        console.log('Payphone Request Payload:', JSON.stringify(payload, null, 2))

        const res = await fetch(`${this.baseUrl}/api/button/Prepare`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('Payphone Response Error:', res.status, errorText)
            throw new Error(`Payphone Error: ${res.statusText} - Check server logs for HTML detail`)
        }

        return res.json()
    }

    async confirmPayment(id: string, clientTxId: string): Promise<ConfirmPaymentResponse> {
        // Using /api/button/V2/Confirm
        const res = await fetch(`${this.baseUrl}/api/button/V2/Confirm`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                id: parseInt(id),
                clientTxId
            })
        })

        if (!res.ok) {
            throw new Error(`Failed to confirm payment`)
        }

        return res.json()
    }
}
