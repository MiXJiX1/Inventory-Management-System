import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // DEBUG: Only for troubleshooting production redirection
    console.log(`[Middleware] Path: ${pathname}, Token found: ${!!refreshToken}`);

    // 1. If trying to access the root path '/'
    if (pathname === '/') {
        if (refreshToken) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. Protected Routes: If trying to access dashboard routes without being logged in
    const isDashboardRoute = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/products') ||
        pathname.startsWith('/categories') ||
        pathname.startsWith('/audit-logs') ||
        pathname.startsWith('/profit-loss');

    if (isDashboardRoute && !refreshToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Auth Routes: If trying to access login/register while already logged in
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    if (isAuthRoute && refreshToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/',
        '/login',
        '/register',
        '/dashboard',
        '/dashboard/:path*',
        '/products/:path*',
        '/categories/:path*',
        '/audit-logs/:path*',
        '/profit-loss/:path*',
    ],
};
