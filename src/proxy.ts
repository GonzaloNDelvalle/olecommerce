import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "ole_admin_session";

/**
 * En Next.js 16, `middleware.ts` fue deprecado y reemplazado por `proxy.ts`.
 * Protege todas las rutas del Backoffice bajo `/admin/:path*`.
 */
export function proxy(request: NextRequest) {
  const adminKey = process.env.ADMIN_ACCESS_KEY?.trim();

  // En entorno de desarrollo local, si aún no se definió ADMIN_ACCESS_KEY en .env, permitir acceso
  if (!adminKey && process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Permitir autenticación vía query param: /admin?key=TU_ADMIN_KEY
  const queryKey = request.nextUrl.searchParams.get("key");
  if (adminKey && queryKey === adminKey) {
    const cleanUrl = new URL(request.nextUrl.pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: adminKey,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  }

  // Validar cookie de sesión de administrador
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!adminKey || sessionCookie !== adminKey) {
    return NextResponse.redirect(new URL("/productos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
