import { NextResponse } from 'next/server';

export function middleware() {
  // Add any middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};