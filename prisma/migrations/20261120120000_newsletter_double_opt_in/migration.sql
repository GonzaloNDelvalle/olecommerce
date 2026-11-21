-- Doble confirmación del newsletter: la suscripción queda PENDING hasta que
-- la persona abre el link que se le envía por email.
ALTER TYPE "NewsletterStatus" ADD VALUE IF NOT EXISTS 'PENDING';

ALTER TABLE "newsletter_subscribers" ADD COLUMN "confirm_token" VARCHAR(64);
CREATE UNIQUE INDEX "newsletter_subscribers_confirm_token_key" ON "newsletter_subscribers"("confirm_token");
