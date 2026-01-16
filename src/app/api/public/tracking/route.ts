import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const orderNumber = searchParams.get('order')

    if (!slug || !orderNumber) {
        return NextResponse.json(
            { error: 'Parámetros inválidos' },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    // Get tenant by slug (case-insensitive)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .ilike('slug', slug)
        .single()

    if (!tenant) {
        return NextResponse.json(
            { error: 'Empresa no encontrada' },
            { status: 404 }
        )
    }

    // Get order by number and tenant
    const { data: order } = await supabase
        .from('work_orders')
        .select(`
            id,
            order_number,
            device_type,
            device_brand,
            device_model,
            status,
            problem_description,
            created_at,
            updated_at
        `)
        .eq('tenant_id', tenant.id)
        .eq('order_number', orderNumber)
        .single()

    if (!order) {
        return NextResponse.json(
            { error: 'Orden no encontrada' },
            { status: 404 }
        )
    }

    return NextResponse.json({ order })
}
