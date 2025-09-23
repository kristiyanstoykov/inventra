import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-current-path', request.nextUrl.pathname);

  const sessionId = request.cookies.get('session-id')?.value;
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // Redirect to 404 if user is not authenticated
  if (isAdminPath && !sessionId) {
    // Store the intended destination in a cookie or URL parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.rewrite(new URL('/', request.url));
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
