-- Textos editables de la tienda
CREATE TABLE "site_texts" (
    "key" VARCHAR(80) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_texts_pkey" PRIMARY KEY ("key")
);
