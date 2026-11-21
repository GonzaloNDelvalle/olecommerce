-- Portada: carrusel del banner, imágenes de temporada elegidas, outfits y redes sociales.
ALTER TABLE "site_content"
  ADD COLUMN "hero_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "featured_image_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "store_settings"
  ADD COLUMN "tiktok_url" VARCHAR(255),
  ADD COLUMN "facebook_url" VARCHAR(255);

CREATE TABLE "outfits" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outfits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outfit_items" (
    "outfit_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outfit_items_pkey" PRIMARY KEY ("outfit_id","product_id")
);

CREATE INDEX "outfits_is_active_sort_order_idx" ON "outfits"("is_active", "sort_order");
CREATE INDEX "outfit_items_product_id_idx" ON "outfit_items"("product_id");

ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
