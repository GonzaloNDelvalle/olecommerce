-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discount_percentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weight_in_grams" INTEGER NOT NULL DEFAULT 0;
