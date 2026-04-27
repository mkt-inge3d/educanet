import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rutas que no requieren auth y no tienen lógica especial
const fullyPublicPaths = [
  "/reset-password",
  "/update-password",
  "/unauthorized",
  "/verificar",
];

function isFullyPublic(pathname: string): boolean {
  if (fullyPublicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/verificar/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

async function getUser(request: NextRequest) {
  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rutas completamente públicas: pasar sin checks
  if (isFullyPublic(pathname)) {
    return response;
  }

  // Landing y auth pages necesitan saber si hay sesión, pero no bloquean
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    const user = await getUser(request);
    if (user) return NextResponse.redirect(new URL("/home", request.url));
    return response;
  }

  // Rutas protegidas: requieren sesión
  const user = await getUser(request);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

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
