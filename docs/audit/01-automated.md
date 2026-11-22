# Fase 1: Barrido automático (2026-11-19)

## Correcciones aplicadas antes del barrido
| Cambio | Archivo |
|---|---|
| `next` 16.4.2 → 16.4.6 (avisos de fuga de caché con `use cache`), `eslint-config-next` alineado | `package.json` |
| Override `next: 16.4.6` para unificar la copia 16.4.3 que traía `@react-email/ui` | `pnpm-workspace.yaml` |
| `watch()` → `useWatch` en el checkout (el React Compiler ya puede optimizarlo) | `CheckoutForm.tsx` |
| Guard de hidratación con `useSyncExternalStore` en vez de `setState` dentro de un efecto | `CheckoutForm.tsx` |
| Redirección a Mercado Pago con `window.location.assign` | `CheckoutForm.tsx` |
| Paso `pnpm audit --prod --audit-level=high` en el CI | `.github/workflows/ci.yml` |

Verificado después de los cambios: typecheck OK, lint 0 errores (2 warnings), 86/86 tests, build OK.

## Hallazgos

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| F1-01 | Alta (solo desarrollo) | `deepmerge-ts` <8 (stack exhaustion) llega por `better-auth > prisma > @prisma/config`. Lo usa el CLI de Prisma al leer su config, no el runtime de la tienda. | Abierto. Se resuelve al actualizar Prisma/better-auth. |
| F1-02 | Moderada (solo desarrollo) | `minimatch` <11.0.1 (DoS) por la cadena de `eslint-config-next`. | Abierto, bajo riesgo. |
| F1-03 | Media | **No hay cabeceras de seguridad**: ni CSP, ni `X-Frame-Options`/`frame-ancestors`, ni HSTS, ni `Referrer-Policy`, ni `X-Content-Type-Options`, ni `Permissions-Policy` (ni en `next.config.ts`, ni en `proxy.ts`, ni en `vercel.json`). | Abierto. Pasa a la Fase 2. |
| F1-04 | Baja | `images.remotePatterns` permite `media.istockphoto.com` y `images.unsplash.com`, que parecen restos de maquetas. | Abierto. |
| F1-05 | Baja | 20 dependencias con versión nueva disponible (parches menores), entre ellas `better-auth` 1.7.18 → 1.7.25 (librería de autenticación) y `mercadopago` 3.6.1 → 3.6.2. `@types/bcryptjs` está deprecado. | Abierto. |
| F1-06 | Info | 2 warnings de lint restantes (`watch()` en los formularios admin de producto). | Abierto. |

## Limpio
- **Secretos**: ninguno en archivos versionados ni en el historial de todas las ramas (patrones de Mercado Pago, Stripe, AWS, claves privadas, URLs de base de datos, `*_SECRET=`). `.env` está ignorado y nunca se commiteó.
- **Variables `NEXT_PUBLIC_*`**: solo APP_URL, DSN de Sentry, GA y Meta Pixel; ninguna es un secreto.
- **Código inseguro**: sin `eval`/`new Function`. Un único `dangerouslySetInnerHTML` (JSON-LD) y escapa `<`, que es correcto.
- **Tipos**: cero `any`, `@ts-ignore` o `@ts-expect-error`. Sin variables ni parámetros sin usar (`tsc --noUnusedLocals`). 3 `eslint-disable`, todos justificados.
- `src/env.ts` valida las variables obligatorias con zod.
