import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't need authentication
const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/tracking',
    '/cliente/login',
    '/pricing',
    '/terminos',
    '/privacidad'
]

// API routes should always be accessible
const isApiRoute = (pathname: string) => pathname.startsWith('/api/')

// Static/public assets
const isStaticAsset = (pathname: string) => {
    return pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname.includes('.') // files with extensions
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Always allow API routes
    if (isApiRoute(pathname)) {
        return NextResponse.next()
    }

    // Always allow static assets
    if (isStaticAsset(pathname)) {
        return NextResponse.next()
    }

    // Allow public paths
    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith('/tracking/')
    )

    if (isPublicPath) {
        return NextResponse.next()
    }

    // For protected routes, check if we have auth cookie
    // The actual auth check happens in the layout/page using Zustand store
    // This middleware just ensures basic routing works
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)',
    ],
}
