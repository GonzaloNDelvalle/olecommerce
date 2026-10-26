// prisma/seed.ts
import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

/**
 * Genera un hash seguro usando scrypt nativo de Node.js (formato salt:hash)
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function main() {
  console.log("🌱 Iniciando seed de la base de datos OLEcommerce...");

  // ==========================================
  // 1. USUARIO ADMINISTRADOR
  // ==========================================
  const adminEmail = "admin@olecommerce.com.ar";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashPassword("Admin1234!"), // Contraseña temporal de desarrollo
      firstName: "Admin",
      lastName: "OLEcommerce",
      documentNumber: "30123456789",
      phone: "+5491112345678",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Usuario Admin listo: ${adminUser.email}`);

  // ==========================================
  // 2. CATÁLOGO BASE DE TALLES (XS a XL + Único)
  // ==========================================
  const sizesData = [
    { name: "XS", sortOrder: 1 },
    { name: "S", sortOrder: 2 },
    { name: "M", sortOrder: 3 },
    { name: "L", sortOrder: 4 },
    { name: "XL", sortOrder: 5 },
    { name: "Único", sortOrder: 6 },
  ];

  const sizesMap: Record<string, string> = {};
  for (const s of sizesData) {
    const record = await prisma.size.upsert({
      where: { name: s.name },
      update: { sortOrder: s.sortOrder },
      create: s,
    });
    sizesMap[s.name] = record.id;
  }
  console.log(`✅ Talles creados/actualizados: ${Object.keys(sizesMap).join(", ")}`);

  // ==========================================
  // 3. CATÁLOGO BASE DE COLORES (con códigos Hex reales)
  // ==========================================
  const colorsData = [
    { name: "Negro", hexCode: "#111111" },
    { name: "Blanco Off-White", hexCode: "#FAF9F6" },
    { name: "Verde Esmeralda", hexCode: "#046307" },
    { name: "Borgoña", hexCode: "#6B1D2F" },
    { name: "Beige Arena", hexCode: "#D8C3A5" },
  ];

  const colorsMap: Record<string, string> = {};
  for (const c of colorsData) {
    const record = await prisma.color.upsert({
      where: { name: c.name },
      update: { hexCode: c.hexCode },
      create: c,
    });
    colorsMap[c.name] = record.id;
  }
  console.log(`✅ Colores creados/actualizados: ${Object.keys(colorsMap).join(", ")}`);

  // ==========================================
  // 4. COLECCIÓN / TEMPORADA Y DOS CATEGORÍAS
  // ==========================================
  const collection = await prisma.collection.upsert({
    where: { slug: "otono-invierno-2026" },
    update: {},
    create: {
      name: "Otoño-Invierno 2026",
      slug: "otono-invierno-2026",
      description: "Colección principal de temporada con cortes sastreros y texturas cálidas.",
      isActive: true,
    },
  });

  const catPartesDeArriba = await prisma.category.upsert({
    where: { slug: "partes-de-arriba" },
    update: {},
    create: {
      name: "Partes de Arriba",
      slug: "partes-de-arriba",
      description: "Blusas, tops, camisas, vestidos y prendas superiores.",
      isActive: true,
    },
  });

  const catPantalones = await prisma.category.upsert({
    where: { slug: "pantalones" },
    update: {},
    create: {
      name: "Pantalones",
      slug: "pantalones",
      description: "Pantalones sastreros, palazzos, jeans y calzas.",
      isActive: true,
    },
  });
  console.log(`✅ Categorías listas: "${catPartesDeArriba.name}" y "${catPantalones.name}"`);

  // ==========================================
  // 5. PRODUCTO DE PRUEBA + 2 VARIANTES (Stock: 10 c/u)
  // ==========================================
  const testProduct = await prisma.product.upsert({
    where: { slug: "vestido-de-prueba" },
    update: {
      basePrice: 85000.0,
      compareAtPrice: 98000.0,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
    },
    create: {
      name: "Vestido de Prueba",
      slug: "vestido-de-prueba",
      description:
        "Vestido midi de corte fluido con caída satinada. Ideal tanto para eventos de noche como para un look elegante de media estación.",
      careGuide: "Lavar a mano con agua fría y jabón neutro. No retorcer ni usar secadora. Plancha tibia del revés.",
      composition: "95% Poliéster Satinado, 5% Elastano",
      sizeGuideUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      basePrice: 85000.0,
      compareAtPrice: 98000.0,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      // Datos logísticos para cotización volumétrica en Argentina (kg y cm)
      weight: 0.35,
      length: 30.0,
      width: 25.0,
      height: 5.0,
      categoryId: catPartesDeArriba.id,
      collectionId: collection.id,
    },
  });

  // Variante 1: Talle S + Color Negro (10 unidades)
  const variant1 = await prisma.productVariant.upsert({
    where: { sku: "VES-PRU-NEG-S" },
    update: { stock: 10 },
    create: {
      sku: "VES-PRU-NEG-S",
      productId: testProduct.id,
      sizeId: sizesMap["S"],
      colorId: colorsMap["Negro"],
      stock: 10,
      reservedStock: 0,
      isActive: true,
    },
  });

  // Variante 2: Talle M + Color Verde Esmeralda (10 unidades)
  const variant2 = await prisma.productVariant.upsert({
    where: { sku: "VES-PRU-ESM-M" },
    update: { stock: 10 },
    create: {
      sku: "VES-PRU-ESM-M",
      productId: testProduct.id,
      sizeId: sizesMap["M"],
      colorId: colorsMap["Verde Esmeralda"],
      stock: 10,
      reservedStock: 0,
      isActive: true,
    },
  });

  // Galería de imágenes iniciales para el producto (si aún no tiene imágenes cargadas)
  const existingImages = await prisma.productImage.count({
    where: { productId: testProduct.id },
  });

  if (existingImages === 0) {
    await prisma.productImage.createMany({
      data: [
        {
          productId: testProduct.id,
          colorId: colorsMap["Negro"],
          url: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1000&q=80",
          altText: "Vestido de Prueba en color Negro - Vista Frontal",
          position: 0,
        },
        {
          productId: testProduct.id,
          colorId: colorsMap["Verde Esmeralda"],
          url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80",
          altText: "Vestido de Prueba en color Verde Esmeralda - Vista Frontal",
          position: 1,
        },
      ],
    });
  }

  console.log(
    `✅ Producto "${testProduct.name}" listo con 2 variantes: [${variant1.sku} (Stock: ${variant1.stock})] y [${variant2.sku} (Stock: ${variant2.stock})]`
  );
  console.log("🚀 Seed finalizado con éxito.");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });