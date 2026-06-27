import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Agent app auth routes (unauthenticated access only)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/update-password", "/verify-email"];

// Routes that anyone can access
const PUBLIC_ROUTES = ["/", "/auth/callback"];

// Portal-specific public routes (unauthenticated portal visitors)
const PORTAL_PUBLIC_ROUTES = ["/portal/login"];

// Error pages accessible without auth
const ERROR_ROUTES = ["/unauthorized", "/invitation-expired", "/invitation-invalid"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isInvitationRoute = pathname.startsWith("/invitation/");
  const isPortalRoute = pathname.startsWith("/portal");
  const isPortalPublicRoute = PORTAL_PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isErrorRoute = ERROR_ROUTES.some((r) => pathname.startsWith(r));

  // Always pass through: API, public pages, error pages
  if (isApiRoute || isPublicRoute || isErrorRoute) {
    return supabaseResponse;
  }

  // Invitation pages are auth pages but also accessible without account (new user flow)
  if (isInvitationRoute) {
    return supabaseResponse;
  }

  // Portal routes: public login allowed; all other portal routes require auth
  if (isPortalRoute) {
    if (isPortalPublicRoute) return supabaseResponse;
    if (!user) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    return supabaseResponse;
  }

  // Authenticated users visiting agent auth pages → send to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users visiting protected agent-app pages → login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
