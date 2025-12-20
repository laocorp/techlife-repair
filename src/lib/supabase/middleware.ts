// Enhanced Middleware with Role-Based Route Protection
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route access by role
const routePermissions: Record<string, string[]> = {
    '/dashboard': ['admin', 'tecnico', 'vendedor'],
    '/pos': ['admin', 'vendedor'],
    '/inventario': ['admin', 'vendedor'],
    '/caja': ['admin', 'vendedor'],
    '/ordenes': ['admin', 'tecnico'],
    '/contabilidad': ['admin'],
    '/facturacion': ['admin', 'vendedor'],
    '/admin': ['admin'],
    '/cliente': ['cliente'],
    '/superadmin': ['superadmin'],
    '/reportes': ['admin'],
    '/configuracion': ['admin'],
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes - no auth needed
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/tracking', '/cliente/login', '/pricing', '/terminos', '/privacidad']
    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith('/tracking/')
    )

    if (isPublicPath) {
        // Redirect logged in users away from auth pages
        if (user && (pathname === '/login' || pathname === '/register')) {
            const url = request.nextUrl.clone()
            // Check if super admin
            if (user.user_metadata?.is_super_admin) {
                url.pathname = '/superadmin'
            } else {
                url.pathname = '/dashboard'
            }
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // Protected routes - require auth
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // Super admin bypass
    if (user.user_metadata?.is_super_admin) {
        return supabaseResponse
    }

    // Get user role from database
    const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, activo, empresa_id')
        .eq('id', user.id)
        .single()

    // User not found or inactive
    if (!userData || !userData.activo) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'account_inactive')
        await supabase.auth.signOut()
        return NextResponse.redirect(url)
    }

    // Check empresa subscription
    const { data: empresa } = await supabase
        .from('empresas')
        .select('suscripcion_activa, fecha_vencimiento')
        .eq('id', userData.empresa_id)
        .single()

    if (empresa && !empresa.suscripcion_activa) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscription-expired'
        return NextResponse.redirect(url)
    }

    // Check route permissions
    const matchedRoute = Object.keys(routePermissions).find(route =>
        pathname.startsWith(route)
    )

    if (matchedRoute) {
        const allowedRoles = routePermissions[matchedRoute]
        if (!allowedRoles.includes(userData.rol)) {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
        }
    }

    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-role', userData.rol)
    requestHeaders.set('x-empresa-id', userData.empresa_id)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}
