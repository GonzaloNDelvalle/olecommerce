-- Textos editables del banner de newsletter (portada)
ALTER TABLE "site_content"
  ADD COLUMN "newsletter_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "newsletter_eyebrow" VARCHAR(120) NOT NULL DEFAULT 'Manifiesto OL.',
  ADD COLUMN "newsletter_title" VARCHAR(160) NOT NULL DEFAULT '“Prendas versátiles. Estado de calma y equilibrio.”',
  ADD COLUMN "newsletter_text" VARCHAR(400),
  ADD COLUMN "newsletter_button_label" VARCHAR(40) NOT NULL DEFAULT 'Suscribirme';

-- Mismos textos que muestra hoy la portada
UPDATE "site_content"
SET "newsletter_eyebrow" = 'Manifiesto OL. — ' || "collection_name",
    "newsletter_text" = 'Suscribite a nuestro archivo privado para recibir acceso anticipado a nuevos lanzamientos de cápsula, preventas exclusivas y ediciones limitadas.'
WHERE "id" = 1;

-- Suscriptoras
CREATE TYPE "NewsletterStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "source" VARCHAR(40) NOT NULL DEFAULT 'home',
    "unsubscribe_token" VARCHAR(64) NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_key" ON "newsletter_subscribers"("unsubscribe_token");
CREATE INDEX "newsletter_subscribers_status_created_at_idx" ON "newsletter_subscribers"("status", "created_at");
