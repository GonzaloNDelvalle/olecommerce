# OL. Indumenti — Ecommerce

Tienda online de indumentaria femenina: catálogo con variantes de talle y color, checkout con Mercado Pago y transferencia bancaria, envíos configurables, cuentas de clientas y panel de administración.

## Stack

| Área | Herramienta |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) + React 19 + TypeScript |
| Base de datos | Postgres en Neon + Prisma 6 (adaptador Neon por WebSocket) |
| Autenticación | Better Auth (email + contraseña, verificación de email, recuperación, límite de intentos) |
| Pagos | Mercado Pago Checkout Pro + transferencia bancaria |
| Imágenes | Cloudinary (subida firmada directa desde el navegador) |
| Emails | React Email (plantillas en `src/emails/`) + Resend |
| Estilos | Tailwind CSS 4, Motion |
| Monitoreo | Sentry, Vercel Analytics / Speed Insights, GA4 y Meta Pixel opcionales |
| Tests | Vitest (unitarios) y Playwright (punta a punta) |

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env   # completar los valores
pnpm db:migrate        # aplica las migraciones
pnpm db:seed           # catálogo de ejemplo (opcional)
pnpm dev
```

Para crear la cuenta de administración (con `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el `.env`):

```bash
pnpm admin:create
```

Después se ingresa por `/login` y el panel está en `/admin`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` / `pnpm typecheck` | ESLint y TypeScript |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:e2e` | Tests de punta a punta (Playwright, requiere `pnpm build` y la base del `.env`) |
| `pnpm db:migrate` | Aplica migraciones pendientes (`prisma migrate deploy`) |
| `pnpm admin:create` | Crea o promueve una cuenta ADMIN |
| `pnpm email:dev` | Vista previa de los emails en http://localhost:3030 |

## Deploy en Vercel

1. Importar el repositorio en Vercel (framework: Next.js) y elegir la región `gru1` (São Paulo), la misma que la base de Neon.
2. Cargar las variables de `.env.example` en *Environment Variables*. Obligatorias: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `MP_ACCESS_TOKEN`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` y las tres de Cloudinary. Si falta alguna, la app no arranca y el log dice cuál.
3. Aplicar migraciones antes del deploy que las trae: `pnpm db:migrate` con `DATABASE_URL` apuntando a la conexión directa de producción.
4. En Mercado Pago, configurar el webhook en `https://<dominio>/api/webhooks/mercadopago` y copiar la clave secreta en `MP_WEBHOOK_SECRET`.
5. El cron de `vercel.json` vence las órdenes impagas una vez por día. Para correrlo más seguido, llamar a `/api/cron/expire-orders` desde un programador externo con `Authorization: Bearer <CRON_SECRET>`.

## Antes de lanzar

- En `/admin/configuracion`: datos reales de contacto y de la cuenta bancaria (vienen con valores de ejemplo).
- En `/admin/envios`: costos y zonas de envío reales.
- Verificar el dominio en Resend y usar un remitente propio en `EMAIL_FROM`.
- Desactivar o cambiar la contraseña de cualquier admin creado con datos de ejemplo.

## Estructura

```
src/
  app/              Rutas (tienda en (shop), panel en (admin), API en api/)
  modules/          Lógica por dominio: products, orders, admin, auth, legal, settings
  lib/              Infraestructura: db, auth guards, caché, emails, rate limit
  components/       Componentes compartidos de layout y tienda
prisma/             Esquema, migraciones y seed
e2e/                Tests de Playwright
scripts/            Scripts de mantenimiento (crear admin)
```
