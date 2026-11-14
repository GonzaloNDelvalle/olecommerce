import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * En Next.js 16, `middleware.ts` fue reemplazado por `proxy.ts` (runtime Node.js).
 *
 * 1. Redirige con 301 las URLs viejas de categoría (`/productos?categoria=x`)
 *    a su página propia (`/categoria/x`), conservando el resto de los filtros.
 * 2. Protege las páginas del Backoffice bajo `/admin/:path*` exigiendo una
 *    sesión de Better Auth con rol ADMIN. Es solo la primera capa: cada Server
 *    Action del admin vuelve a validar con `requireAdmin()`.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/productos") {
    const category = searchParams.get("categoria")?.trim();
    if (!category) return NextResponse.next();

    const target = new URL(`/categoria/${encodeURIComponent(category)}`, request.nextUrl.origin);
    for (const [key, value] of searchParams) {
      if (key !== "categoria" && key !== "pagina") target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target, 301);
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/productos"],
};
