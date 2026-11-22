# Fase 0: Línea base (2026-11-19)

Rama de auditoría: `audit/full-store` (creada desde `feat/shipping-rate-tables`, árbol limpio).

| Chequeo | Resultado |
|---|---|
| `pnpm typecheck` | OK, 0 errores |
| `pnpm lint` | OK, 0 errores, 3 warnings (`react-hooks/incompatible-library`: `watch()` de react-hook-form en CheckoutForm y en los formularios admin de producto nuevo/editar) |
| `pnpm test` (vitest) | OK, 10 archivos, 86 tests |
| `pnpm build` | OK en el segundo intento. El primero abortó por un chequeo de seguridad de Next.js (ver abajo) |
| E2E (Playwright) | No ejecutado todavía (Fase 4). Solo existe `e2e/smoke.spec.ts` |

## Hallazgo temprano: dependencias
`pnpm audit` (verificado de forma independiente): 4 vulnerabilidades (1 alta, 3 moderadas).
- `next` 16.4.2: dos avisos moderados (fuga entre `root params` con `use cache`), corregidos en `>=16.4.5`.
- `minimatch` (cadena de `eslint-config-next`): DoS moderado, solo en tiempo de desarrollo.
- Una alta: detalle en la Fase 1.

## Inventario
- Next 16.4.2, React 19.3, Prisma 6 + Neon, better-auth, mercadopago SDK, Resend, Cloudinary, Sentry.
- Rutas sensibles detectadas en el build: `/api/webhooks/mercadopago`, `/api/cron/expire-orders`, `/api/auth/[...all]`, `proxy.ts` (middleware), panel `/admin/*`.
- `.env` está ignorado por git; solo `.env.example` está versionado.
- 278 archivos versionados. Módulos: admin, auth, content, legal, newsletter, orders, products, seo, settings.
