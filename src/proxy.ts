import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * En Next.js 16, `middleware.ts` fue reemplazado por `proxy.ts` (runtime Node.js).
 *
 * Protege las páginas del Backoffice bajo `/admin/:path*` exigiendo una sesión
 * de Better Auth con rol ADMIN. Es solo la primera capa: cada Server Action del
 * admin vuelve a validar con `requireAdmin()` (ver `src/lib/auth-guards.ts`).
 */
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
