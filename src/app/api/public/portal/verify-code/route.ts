import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const { client_id, code } = await request.json()

    if (!client_id || !code) {
        return NextResponse.json(
            { error: 'Client ID y código requeridos' },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    // Call the database function to verify auth code
    const { data, error } = await supabase.rpc('verify_client_auth_code', {
        p_client_id: client_id,
        p_code: code
    })

    if (error) {
        console.error('Error verifying auth code:', error)
        return NextResponse.json(
            { error: 'Error al verificar código' },
            { status: 500 }
        )
    }

    if (!data.success) {
        return NextResponse.json(
            { error: data.error },
            { status: 400 }
        )
    }

    return NextResponse.json({
        success: true,
        client: data.client
    })
}
