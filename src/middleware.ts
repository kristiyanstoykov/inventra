import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from './auth/core/session';

export const config = {
  runtime: 'nodejs', // Now stable!
};

export async function middleware(request: NextRequest) {
  // Complex authentication logic
  const sessionId = request.cookies.get('session-id')?.value;
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // Redirect to 404 if user is not authenticated
  if (isAdminPath && !sessionId) {
    // Store the intended destination in a cookie or URL parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.rewrite(new URL('/', request.url));
  }

  const user = await getUserFromSession(request.cookies);
  if (isAdminPath && (!user || user.role !== 'admin')) {
    return NextResponse.redirect(new URL('404', request.url));
  }

  return NextResponse.next();
}
