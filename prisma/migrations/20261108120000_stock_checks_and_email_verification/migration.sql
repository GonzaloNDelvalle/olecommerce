-- Verificación de email: contraseña pendiente hasta confirmar la casilla
ALTER TABLE "users" ADD COLUMN "pending_password_hash" TEXT;

-- Normalizar datos previos para que las restricciones puedan aplicarse
UPDATE "product_variants" SET "stock" = 0 WHERE "stock" < 0;
UPDATE "product_variants" SET "reserved_stock" = 0 WHERE "reserved_stock" < 0;
UPDATE "product_variants" SET "reserved_stock" = "stock" WHERE "reserved_stock" > "stock";
UPDATE "products" SET "discount_percentage" = LEAST(GREATEST("discount_percentage", 0), 100);

-- Integridad de inventario: última red de seguridad ante bugs de código o carreras
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_stock_non_negative" CHECK ("stock" >= 0),
  ADD CONSTRAINT "product_variants_reserved_non_negative" CHECK ("reserved_stock" >= 0),
  ADD CONSTRAINT "product_variants_reserved_lte_stock" CHECK ("reserved_stock" <= "stock");

ALTER TABLE "products"
  ADD CONSTRAINT "products_discount_percentage_range" CHECK ("discount_percentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "products_base_price_non_negative" CHECK ("base_price" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0);
