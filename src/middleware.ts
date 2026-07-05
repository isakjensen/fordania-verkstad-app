import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Skyddar appen: saknas en session-cookie skickas besökaren till /login.
 * Detta är en optimistisk koll (ingen DB) – den faktiska behörighetskollen
 * görs i server-komponenterna/layouterna.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skydda allt utom inloggning, offline-fallback, PWA-filer (manifest +
  // service worker), auth-API, Next-interna filer och statiska assets.
  matcher: [
    "/((?!login|offline|manifest.webmanifest|sw.js|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
