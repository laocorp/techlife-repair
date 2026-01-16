import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
        return NextResponse.json(
            { error: 'Client ID requerido' },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    // Get orders for this client
    const { data: orders, error } = await supabase
        .from('work_orders')
        .select(`
            id,
            order_number,
            device_type,
            device_brand,
            device_model,
            status,
            problem_description,
            created_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching client orders:', error)
        return NextResponse.json(
            { error: 'Error al obtener órdenes' },
            { status: 500 }
        )
    }

    return NextResponse.json({ orders })
}
