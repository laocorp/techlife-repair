import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/pricing', '/features', '/suspended']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public routes and static assets
    if (PUBLIC_ROUTES.some(route => pathname === route) || pathname.startsWith('/api/webhooks')) {
        return (await updateSession(request)).supabaseResponse
    }

    // Update session and get user
    const { supabaseResponse, user, supabase } = await updateSession(request)

    // No user - redirect to login
    if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Check if accessing super admin routes
    if (pathname.startsWith('/admin')) {
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('id')
            .eq('user_id', user.id)
            .single() as { data: { id: string } | null }

        if (!superAdmin) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Check tenant status for dashboard routes
    if (pathname.startsWith('/dashboard')) {
        // Get user's tenant
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('auth_user_id', user.id)
            .single() as { data: { tenant_id: string; role: string } | null }

        if (!userData) {
            // User has no tenant - redirect to onboarding
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        // Check tenant status
        const { data: tenant } = await supabase
            .from('tenants')
            .select('status, payment_due_date')
            .eq('id', userData.tenant_id)
            .single() as { data: { status: string; payment_due_date: string | null } | null }

        if (tenant?.status === 'suspended') {
            // Allow access to billing page only
            if (!pathname.startsWith('/dashboard/settings/billing')) {
                return NextResponse.redirect(new URL('/suspended', request.url))
            }
        }

        // Check if payment is overdue (3 days grace period)
        if (tenant?.payment_due_date) {
            const dueDate = new Date(tenant.payment_due_date)
            const gracePeriod = new Date(dueDate.getTime() + 3 * 24 * 60 * 60 * 1000)

            if (new Date() > gracePeriod && !pathname.startsWith('/dashboard/settings/billing')) {
                return NextResponse.redirect(new URL('/dashboard/settings/billing', request.url))
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
