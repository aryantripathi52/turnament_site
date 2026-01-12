import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/admin', '/player'];

  // If trying to access a protected route without a session, redirect to login
  if (!session && protectedRoutes.some(path => pathname.startsWith(path))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access login page, redirect to home
  if (session && pathname === '/login') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*', '/player/:path*', '/login'],
};
