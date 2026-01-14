import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// =====================================================
// TYPES
// =====================================================

interface WebhookRequest {
    webhook_id: string
    webhook_url: string
    webhook_secret?: string
    webhook_headers?: Record<string, string>
    max_retries: number
    event_type: string
    tenant_id: string
    data: any
}

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, content-type',
            },
        })
    }

    try {
        const payload: WebhookRequest = await req.json()
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        console.log(`[Webhook] Processing event: ${payload.event_type} for webhook ${payload.webhook_id}`)

        const startTime = Date.now()

        // =====================================================
        // Prepare Webhook Payload
        // =====================================================

        const webhookPayload = {
            event: payload.event_type,
            tenant_id: payload.tenant_id,
            data: payload.data,
            timestamp: new Date().toISOString(),
        }

        // =====================================================
        // Generate HMAC Signature (if secret provided)
        // =====================================================

        let signature: string | undefined

        if (payload.webhook_secret) {
            const encoder = new TextEncoder()
            const keyData = encoder.encode(payload.webhook_secret)
            const dataToSign = encoder.encode(JSON.stringify(webhookPayload))

            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            )

            const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign)
            signature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
        }

        // =====================================================
        // Prepare HTTP Headers
        // =====================================================

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'User-Agent': 'TechRepair-Webhooks/1.0',
            'X-Webhook-Event': payload.event_type,
            'X-Webhook-Id': payload.webhook_id,
            'X-Webhook-Timestamp': new Date().toISOString(),
            ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
            ...(payload.webhook_headers || {}),
        }

        // =====================================================
        // Send Webhook with Retry Logic
        // =====================================================

        let attempt = 0
        let lastError: string | null = null
        let statusCode: number | null = null
        let responseBody: string | null = null

        while (attempt <= payload.max_retries) {
            try {
                console.log(`[Webhook] Attempt ${attempt + 1}/${payload.max_retries + 1} for ${payload.webhook_url}`)

                const response = await fetch(payload.webhook_url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(webhookPayload),
                    signal: AbortSignal.timeout(10000), // 10 second timeout
                })

                statusCode = response.status
                responseBody = await response.text()

                console.log(`[Webhook] Response: ${statusCode}`)

                // Success (2xx)
                if (response.ok) {
                    const responseTime = Date.now() - startTime

                    // Log success to database
                    await supabase.from('webhook_logs').insert({
                        webhook_id: payload.webhook_id,
                        event_type: payload.event_type,
                        payload: webhookPayload,
                        request_url: payload.webhook_url,
                        request_headers: headers,
                        status_code: statusCode,
                        response_body: responseBody.substring(0, 1000), // Limit size
                        response_time_ms: responseTime,
                        retry_count: attempt,
                        completed_at: new Date().toISOString(),
                    })

                    console.log(`[Webhook] ✅ Success in ${responseTime}ms`)

                    return new Response(
                        JSON.stringify({
                            success: true,
                            status: statusCode,
                            attempts: attempt + 1,
                            response_time_ms: responseTime,
                        }),
                        {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    )
                }

                // 4xx errors should NOT retry (client error)
                if (statusCode >= 400 && statusCode < 500) {
                    lastError = `HTTP ${statusCode}: ${responseBody}`
                    console.log(`[Webhook] ⚠️  Client error, not retrying: ${statusCode}`)
                    break
                }

                // 5xx errors SHOULD retry (server error)
                lastError = `HTTP ${statusCode}: ${responseBody}`
                attempt++

                if (attempt <= payload.max_retries) {
                    // Exponential backoff: 5s, 10s, 20s
                    const delayMs = 5000 * Math.pow(2, attempt - 1)
                    console.log(`[Webhook] Retrying in ${delayMs}ms...`)
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                }

            } catch (error: any) {
                lastError = error.message
                console.error(`[Webhook] Error: ${lastError}`)
                attempt++

                if (attempt <= payload.max_retries) {
                    const delayMs = 5000 * Math.pow(2, attempt - 1)
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                }
            }
        }

        // =====================================================
        // Failed After All Retries
        // =====================================================

        const responseTime = Date.now() - startTime

        console.log(`[Webhook] ❌ Failed after ${attempt} attempts`)

        // Log failure to database
        await supabase.from('webhook_logs').insert({
            webhook_id: payload.webhook_id,
            event_type: payload.event_type,
            payload: webhookPayload,
            request_url: payload.webhook_url,
            request_headers: headers,
            status_code: statusCode,
            response_body: responseBody?.substring(0, 1000),
            response_time_ms: responseTime,
            error: lastError,
            retry_count: attempt,
            completed_at: new Date().toISOString(),
        })

        return new Response(
            JSON.stringify({
                success: false,
                error: lastError,
                attempts: attempt,
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )

    } catch (error: any) {
        console.error('[Webhook] Fatal error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})
