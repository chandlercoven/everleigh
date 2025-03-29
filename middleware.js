import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const TEST_USER_EMAIL = "test@everleigh.ai";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;

    // If user is the test user, check for PIN verification
    if (token?.email === TEST_USER_EMAIL) {
      // Skip PIN check for auth-related routes and API endpoints
      if (req.nextUrl.pathname.startsWith('/api/auth') || 
          req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.next();
      }

      // Check for PIN verification in the session
      const hasVerifiedPin = req.cookies.get('pin_verified')?.value === 'true';
      
      if (!hasVerifiedPin) {
        // Redirect to PIN verification page
        return NextResponse.redirect(new URL('/auth/verify-pin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/verify-pin (PIN verification page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth/verify-pin).*)',
  ],
}; 