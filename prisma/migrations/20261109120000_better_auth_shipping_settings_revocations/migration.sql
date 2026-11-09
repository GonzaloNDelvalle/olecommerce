-- =====================================================================
-- 1. AUTENTICACIÓN: de Auth.js (JWT + password_hash en users) a Better Auth
-- =====================================================================

-- Las tablas de Auth.js no se usaban (sesiones JWT, sin proveedores OAuth):
-- se vacían antes de cambiarles la forma.
DELETE FROM "sessions";
DELETE FROM "accounts";

-- accounts → formato Better Auth
DROP INDEX IF EXISTS "accounts_provider_provider_account_id_key";
ALTER TABLE "accounts"
  DROP COLUMN "expires_at",
  DROP COLUMN "provider",
  DROP COLUMN "provider_account_id",
  DROP COLUMN "session_state",
  DROP COLUMN "token_type",
  DROP COLUMN "type",
  ADD COLUMN "access_token_expires_at" TIMESTAMP(3),
  ADD COLUMN "account_id" TEXT NOT NULL,
  ADD COLUMN "password" TEXT,
  ADD COLUMN "provider_id" TEXT NOT NULL,
  ADD COLUMN "refresh_token_expires_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- Migrar contraseñas existentes (bcrypt) a cuentas "credential".
-- Better Auth las sigue validando con bcrypt; las nuevas usan scrypt.
INSERT INTO "accounts" ("id", "account_id", "provider_id", "user_id", "password", "created_at", "updated_at")
SELECT gen_random_uuid(), "id"::text, 'credential', "id", "password_hash", NOW(), NOW()
FROM "users"
WHERE "password_hash" IS NOT NULL;

-- email_verified: timestamp → boolean. Las cuentas con contraseña activa ya
-- podían ingresar, así que se consideran verificadas.
ALTER TABLE "users" ADD COLUMN "email_verified_bool" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users"
SET "email_verified_bool" = ("email_verified" IS NOT NULL OR "password_hash" IS NOT NULL);
ALTER TABLE "users"
  DROP COLUMN "email_verified",
  DROP COLUMN "password_hash",
  DROP COLUMN "pending_password_hash";
ALTER TABLE "users" RENAME COLUMN "email_verified_bool" TO "email_verified";

-- users.email ya tiene índice único
DROP INDEX IF EXISTS "users_email_idx";

-- sessions → formato Better Auth
DROP INDEX IF EXISTS "sessions_session_token_key";
ALTER TABLE "sessions"
  DROP COLUMN "expires",
  DROP COLUMN "session_token",
  ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL,
  ADD COLUMN "ip_address" TEXT,
  ADD COLUMN "token" TEXT NOT NULL,
  ADD COLUMN "user_agent" TEXT;
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- verification_tokens → verifications
DROP TABLE "verification_tokens";
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- Límite de intentos (Better Auth + formularios propios)
CREATE TABLE "rate_limits" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "last_request" BIGINT NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- =====================================================================
-- 2. ENVÍOS CONFIGURABLES
-- =====================================================================

CREATE TYPE "ShippingMethodType" AS ENUM ('HOME_DELIVERY', 'PICKUP');

CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "type" "ShippingMethodType" NOT NULL DEFAULT 'HOME_DELIVERY',
    "price" DECIMAL(10,2) NOT NULL,
    "free_shipping_threshold" DECIMAL(12,2),
    "estimated_delivery" VARCHAR(80),
    "provinces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "shipping_methods_price_non_negative" CHECK ("price" >= 0)
);
CREATE INDEX "shipping_methods_is_active_sort_order_idx" ON "shipping_methods"("is_active", "sort_order");

-- Métodos iniciales: los precios son de ejemplo y se editan desde /admin/envios
INSERT INTO "shipping_methods" ("id", "name", "description", "type", "price", "free_shipping_threshold", "estimated_delivery", "is_active", "sort_order", "updated_at") VALUES
  (gen_random_uuid(), 'Envío a domicilio', 'Correo a todo el país', 'HOME_DELIVERY', 9500, 250000, '3 a 7 días hábiles', true, 1, NOW()),
  (gen_random_uuid(), 'Retiro en showroom', 'Coordinamos el día y horario por WhatsApp', 'PICKUP', 0, NULL, 'Listo en 24 a 48 h', true, 2, NOW());

-- Órdenes: método de envío + quitar columnas duplicadas de seguimiento
UPDATE "orders" SET "carrier" = COALESCE("carrier", "shipping_carrier"),
                    "tracking_code" = COALESCE("tracking_code", "tracking_number");
ALTER TABLE "orders"
  DROP COLUMN "shipping_carrier",
  DROP COLUMN "tracking_number",
  ADD COLUMN "delivery_type" "ShippingMethodType",
  ADD COLUMN "shipping_method_id" UUID,
  ADD COLUMN "shipping_method_name" VARCHAR(120);
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recuperar el tipo de entrega que antes se guardaba como prefijo en las notas
UPDATE "orders" SET "delivery_type" = 'PICKUP', "shipping_method_name" = 'Retiro en showroom'
WHERE "notes" LIKE '[Retiro en Showroom%';
UPDATE "orders" SET "delivery_type" = 'HOME_DELIVERY', "shipping_method_name" = 'Envío a domicilio'
WHERE "notes" LIKE '[Envío a Domicilio]%';

-- =====================================================================
-- 3. CONFIGURACIÓN DE TIENDA (fila única)
-- =====================================================================

CREATE TABLE "store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "store_name" VARCHAR(120) NOT NULL DEFAULT 'OL. Indumenti',
    "support_email" VARCHAR(255) NOT NULL,
    "whatsapp_number" VARCHAR(40),
    "instagram_url" VARCHAR(255),
    "showroom_address" VARCHAR(255),
    "bank_transfer_enabled" BOOLEAN NOT NULL DEFAULT true,
    "bank_transfer_discount_percentage" INTEGER NOT NULL DEFAULT 15,
    "bank_name" VARCHAR(120),
    "bank_account_holder" VARCHAR(150),
    "bank_cuit" VARCHAR(20),
    "bank_cbu" VARCHAR(30),
    "bank_alias" VARCHAR(60),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "store_settings_singleton" CHECK ("id" = 1),
    CONSTRAINT "store_settings_discount_range" CHECK ("bank_transfer_discount_percentage" BETWEEN 0 AND 50)
);

-- Valores iniciales tomados de src/lib/bank-account.ts: REEMPLAZAR por los reales en /admin/configuracion
INSERT INTO "store_settings" ("id", "support_email", "whatsapp_number", "bank_name", "bank_account_holder", "bank_cuit", "bank_cbu", "bank_alias", "updated_at")
VALUES (1, 'pagos@olecommerce.com.ar', '+54 9 11 2345-6789', 'Banco Galicia — Cuenta Corriente en Pesos', 'OLÉ INDUMENTARIA S.R.L.', '30-71849201-9', '0070099320000048192014', 'OLE.TIENDA.OFICIAL', NOW());

-- =====================================================================
-- 4. ARREPENTIMIENTO (Res. 424/2020)
-- =====================================================================

CREATE TYPE "RevocationStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

CREATE TABLE "revocation_requests" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "order_id" UUID,
    "order_number" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "reason" TEXT,
    "status" "RevocationStatus" NOT NULL DEFAULT 'RECEIVED',
    "admin_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revocation_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "revocation_requests_code_key" ON "revocation_requests"("code");
CREATE INDEX "revocation_requests_status_created_at_idx" ON "revocation_requests"("status", "created_at");
CREATE INDEX "revocation_requests_email_idx" ON "revocation_requests"("email");
ALTER TABLE "revocation_requests" ADD CONSTRAINT "revocation_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- 5. CATÁLOGO: limpieza y búsqueda sin acentos
-- =====================================================================

-- Duplicado de weight_in_grams (sin uso)
ALTER TABLE "products" DROP COLUMN "weight";

-- Índices redundantes: las columnas ya tienen índice único
DROP INDEX IF EXISTS "carts_session_token_idx";
DROP INDEX IF EXISTS "categories_slug_idx";
DROP INDEX IF EXISTS "orders_order_number_idx";
DROP INDEX IF EXISTS "payments_payment_id_idx";
DROP INDEX IF EXISTS "payments_preference_id_idx";
DROP INDEX IF EXISTS "product_variants_sku_idx";
DROP INDEX IF EXISTS "products_slug_idx";

-- Búsqueda insensible a acentos ("pantalon" encuentra "Pantalón")
CREATE EXTENSION IF NOT EXISTS unaccent;
