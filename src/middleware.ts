import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-current-path', request.nextUrl.pathname);

  const sessionId = request.cookies.get('session-id')?.value;
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminPath && !sessionId) {
    // Redirect to 404 if user is not authenticated
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
