import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/is-admin-email";

// Agent app auth routes (unauthenticated access only)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/update-password", "/verify-email"];

// Routes that anyone can access
const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/google/callback", "/privacy", "/terms"];

// Portal-specific public routes (unauthenticated portal visitors)
const PORTAL_PUBLIC_ROUTES = ["/portal/login"];

// Error pages accessible without auth
const ERROR_ROUTES = ["/unauthorized", "/invitation-expired", "/invitation-invalid"];

// Admin routes — requires both auth + admin email check (done in layout)
const ADMIN_ROUTES = ["/admin"];

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
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

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

  // Admin routes — must be authenticated + admin email
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!user.email || !isAdminEmail(user.email)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
  ],
};
