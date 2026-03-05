import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected routes — require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/sessions', '/restaurants', '/profile', '/admin']

// Public routes — no auth required
const PUBLIC_PREFIXES = ['/login', '/auth', '/share']

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

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
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: never nest Supabase calls or run other logic between createServerClient and getUser()
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Redirect authenticated users away from login
    if (user && path === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect auth-required routes
    const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
    if (!user && isProtected) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', path)
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Match all routes except static files and _next
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
