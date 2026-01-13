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
    // Optional order details could be added here
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
    transactionStatus: string // "Approved"
    transactionId: number
    authorizationCode: string
    amount: number
    storeName: string
    clientTransactionId: string
    phoneNumber?: string
    document?: string
    optionalParameter4?: string // CardHolder Name?
}

export class PayphoneClient {
    private config: PayphoneConfig
    private baseUrl: string

    constructor(config: PayphoneConfig) {
        this.config = config
        this.baseUrl = config.region || 'https://pay.payphonetodoesposible.com' // Production URL
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.token}`
        }
    }

    async createLink(request: CreateButtonRequest): Promise<CreateButtonResponse> {
        // Using /api/button/Prepare as recommended
        const payload = {
            ...request,
            storeId: this.config.storeId,
            tax: request.amount - request.amountWithoutTax,
            amountWithTax: 0, // Simplified: assuming all tax logic handled or simple
            service: 0,
            tip: 0,
        }

        const res = await fetch(`${this.baseUrl}/api/button/Prepare`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`Payphone Error: ${error}`)
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
