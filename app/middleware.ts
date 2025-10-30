import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Add any middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};