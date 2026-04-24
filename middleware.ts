import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Route protection middleware.
 *
 * Strategy for role checking: we read the user's role from
 * user_metadata in the JWT token (set during registration and
 * updated by admin actions). This avoids a DB query on every request.
 */

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  "/unauthorized",
  "/verificar",
];

function isPublicPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/verificar/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  // Refresh Supabase session
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Skip auth checks for public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // Check for session by reading the Supabase cookies
  // The updateSession helper already refreshed tokens; now check if user exists
  const {
    data: { user },
  } = await (async () => {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // We don't need to set cookies here; updateSession already did
          },
        },
      }
    );
    return supabase.auth.getUser();
  })();

  // No session → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register → redirect to dashboard
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Admin routes: check role from user_metadata
  if (pathname.startsWith("/admin")) {
    const rol = user.user_metadata?.rol as string | undefined;
    if (rol !== "ADMIN" && rol !== "RRHH") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
