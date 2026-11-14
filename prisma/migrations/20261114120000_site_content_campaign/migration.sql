-- Sección de campaña a pantalla completa en la portada (imagen o video)
ALTER TABLE "site_content"
  ADD COLUMN "campaign_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "campaign_eyebrow" VARCHAR(120) NOT NULL DEFAULT 'Campaña',
  ADD COLUMN "campaign_title" VARCHAR(80) NOT NULL DEFAULT 'Hecho para durar',
  ADD COLUMN "campaign_image_url" TEXT,
  ADD COLUMN "campaign_video_url" TEXT;
