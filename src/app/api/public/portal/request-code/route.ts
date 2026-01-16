import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const { email, slug } = await request.json()

    if (!email || !slug) {
        return NextResponse.json(
            { error: 'Email y slug requeridos' },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    // Call the database function to generate auth code
    const { data, error } = await supabase.rpc('generate_client_auth_code', {
        p_client_email: email,
        p_tenant_slug: slug
    })

    if (error) {
        console.error('Error generating auth code:', error)
        return NextResponse.json(
            { error: 'Error al generar código' },
            { status: 500 }
        )
    }

    if (!data.success) {
        return NextResponse.json(
            { error: data.error },
            { status: 400 }
        )
    }

    // TODO: Send email with code via Resend/SendGrid
    // For now, we'll log the code and return client_id
    console.log(`[DEV] Auth code for ${email}: ${data.code}`)

    return NextResponse.json({
        success: true,
        client_id: data.client_id,
        // Remove in production - just for development
        dev_code: process.env.NODE_ENV === 'development' ? data.code : undefined
    })
}
