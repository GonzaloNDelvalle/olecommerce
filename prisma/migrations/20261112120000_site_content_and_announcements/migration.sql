-- Contenido editable de la portada y de temporada (fila única)
CREATE TABLE "site_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "collection_name" VARCHAR(80) NOT NULL DEFAULT 'Neutral State',
    "season_label" VARCHAR(40) NOT NULL DEFAULT 'FW''26',
    "hero_eyebrow" VARCHAR(120) NOT NULL DEFAULT 'OL Indumenti • Autumn / Winter Collection',
    "hero_title" VARCHAR(80) NOT NULL DEFAULT 'Neutral State - FW''26',
    "hero_subtitle" VARCHAR(300),
    "hero_cta_label" VARCHAR(40) NOT NULL DEFAULT 'Explorar',
    "hero_cta_href" VARCHAR(255) NOT NULL DEFAULT '/productos',
    "hero_image_url" TEXT,
    "hero_video_url" TEXT,
    "announcement_enabled" BOOLEAN NOT NULL DEFAULT true,
    "announcement_rotate_seconds" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_content_singleton" CHECK ("id" = 1),
    CONSTRAINT "site_content_rotate_range" CHECK ("announcement_rotate_seconds" BETWEEN 2 AND 30)
);

-- Valores iniciales: los textos y medios que hoy muestra la portada
INSERT INTO "site_content" ("id", "hero_subtitle", "hero_image_url", "hero_video_url", "updated_at")
VALUES (
  1,
  'Siluetas depuradas, sastrería contemporánea y texturas nobles en una paleta de crudos, piedra y chocolate profundo.',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=85',
  'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-a-brown-coat-41763-large.mp4',
  NOW()
);

-- Mensajes de la barra de anuncios
CREATE TABLE "announcement_messages" (
    "id" UUID NOT NULL,
    "text" VARCHAR(160) NOT NULL,
    "link_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "announcement_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "announcement_messages_dates" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" > "starts_at")
);
CREATE INDEX "announcement_messages_is_active_sort_order_idx" ON "announcement_messages"("is_active", "sort_order");

-- Mensajes de ejemplo (editables en /admin/contenido)
INSERT INTO "announcement_messages" ("id", "text", "link_url", "sort_order", "updated_at") VALUES
  (gen_random_uuid(), 'Envío gratis en compras desde $250.000', '/productos', 1, NOW()),
  (gen_random_uuid(), '15% OFF pagando por transferencia', NULL, 2, NOW()),
  (gen_random_uuid(), 'Cuotas con todas las tarjetas vía Mercado Pago', NULL, 3, NOW());
