import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * En Next.js 16, `middleware.ts` fue deprecado y reemplazado por `proxy.ts`
 * (corre en el runtime de Node.js por defecto).
 *
 * Protege las páginas del Backoffice bajo `/admin/:path*` exigiendo una sesión
 * de Auth.js con rol ADMIN. Es solo la primera capa: cada Server Action del admin
 * vuelve a validar con `requireAdmin()` (ver `src/lib/auth-guards.ts`).
 */
export const proxy = auth((request) => {
  const user = request.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
