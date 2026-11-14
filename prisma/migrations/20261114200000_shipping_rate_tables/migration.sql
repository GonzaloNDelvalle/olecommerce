-- Tarifas de envío por código postal y peso (zonas y tramos), opcionales por método
ALTER TABLE "shipping_methods" ADD COLUMN "rate_table" JSONB;
