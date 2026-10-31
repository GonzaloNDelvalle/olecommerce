import "dotenv/config";
import bcrypt from "bcryptjs";
import { ProductStatus, Role } from "@prisma/client";
import { db } from "../src/lib/db";

interface MockProductSeed {
  name: string;
  slug: string;
  description: string;
  composition: string;
  basePrice: number;
  discountPercentage: number;
  weightInGrams: number;
  isFeatured: boolean;
  categorySlug: string;
  skuPrefix: string;
  colors: string[];
  sizes: string[];
  images: [string, string];
}

const MOCK_PRODUCTS: MockProductSeed[] = [
  {
    name: "Sweater Oslo",
    slug: "sweater-oslo",
    description:
      "Sweater tejido en punto inglés de calce relajado y hombros caídos. Hilado suave de tacto cálido, pensado para superponer en capas neutras.",
    composition: "70% Lana Merino, 30% Algodón Orgánico",
    basePrice: 118000,
    discountPercentage: 10,
    weightInGrams: 520,
    isFeatured: true,
    categorySlug: "tejidos",
    skuPrefix: "SWE-OSL",
    colors: ["Blanco Off-White", "Beige Arena", "Chocolate"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Pantalón Denim Wide",
    slug: "pantalon-denim-wide",
    description:
      "Jean de tiro alto y pierna ancha recta en denim rígido de 13 oz. Lavado neutro atemporal con costuras al tono y calce estructurado.",
    composition: "100% Algodón Denim Premium",
    basePrice: 129000,
    discountPercentage: 0,
    weightInGrams: 680,
    isFeatured: true,
    categorySlug: "denim",
    skuPrefix: "DEN-WID",
    colors: ["Gris Piedra", "Negro", "Blanco Off-White"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Remera Basic Cream",
    slug: "remera-basic-cream",
    description:
      "Remera esencial de cuello redondo cerrado en jersey pesado de algodón peruano peinado. Corte boxy sutil que mantiene su estructura uso tras uso.",
    composition: "100% Algodón Pima Peruano 24/1",
    basePrice: 54000,
    discountPercentage: 0,
    weightInGrams: 240,
    isFeatured: true,
    categorySlug: "partes-de-arriba",
    skuPrefix: "REM-CRM",
    colors: ["Blanco Off-White", "Beige Arena", "Negro"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Blazer Sastrero Siena",
    slug: "blazer-sastrero-siena",
    description:
      "Blazer cruzado de moldería sastrera masculina con hombreras sutiles, solapa en punta y forrería íntegra en viscosa.",
    composition: "80% Lana Fría, 20% Viscosa",
    basePrice: 195000,
    discountPercentage: 15,
    weightInGrams: 740,
    isFeatured: true,
    categorySlug: "partes-de-arriba",
    skuPrefix: "BLZ-SIE",
    colors: ["Chocolate", "Beige Arena", "Negro"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Tapado Lana Cruda Milan",
    slug: "tapado-lana-cruda-milan",
    description:
      "Tapado largo hasta el tobillo en paño de lana doble faz cosido a mano. Cinturón desmontable del mismo género y bolsillos invisibles.",
    composition: "90% Lana Virgen, 10% Cashmere",
    basePrice: 285000,
    discountPercentage: 10,
    weightInGrams: 1150,
    isFeatured: true,
    categorySlug: "partes-de-arriba",
    skuPrefix: "TAP-MIL",
    colors: ["Beige Arena", "Chocolate", "Negro"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Camisa Poplín Arena",
    slug: "camisa-poplin-arena",
    description:
      "Camisa oversize en poplín de algodón crujiente con botones de nácar natural y puños anchos abotonados.",
    composition: "100% Algodón Poplín de Alto Conteo",
    basePrice: 89000,
    discountPercentage: 0,
    weightInGrams: 310,
    isFeatured: false,
    categorySlug: "partes-de-arriba",
    skuPrefix: "CAM-ARE",
    colors: ["Blanco Off-White", "Beige Arena"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Pantalón Sastrero Pinzas",
    slug: "pantalon-sastrero-pinzas",
    description:
      "Pantalón palazzo de doble pinza frontal con caída fluida y cintura limpia con presillas. El aliado ideal del Blazer Siena.",
    composition: "78% Poliéster Reciclado, 18% Viscosa, 4% Elastano",
    basePrice: 134000,
    discountPercentage: 0,
    weightInGrams: 460,
    isFeatured: true,
    categorySlug: "denim",
    skuPrefix: "PAN-PIN",
    colors: ["Beige Arena", "Negro", "Gris Piedra"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Cardigan Punto Grueso",
    slug: "cardigan-punto-grueso",
    description:
      "Cárdigan tejido en galga gruesa con escote en V pronunciado y botones carey. Silueta envolvente pensada para el confort diario.",
    composition: "65% Lana, 35% Poliamida",
    basePrice: 124000,
    discountPercentage: 15,
    weightInGrams: 590,
    isFeatured: false,
    categorySlug: "tejidos",
    skuPrefix: "CAR-PUN",
    colors: ["Chocolate", "Beige Arena", "Blanco Off-White"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Vestido Midi Lino Piedra",
    slug: "vestido-midi-lino-piedra",
    description:
      "Vestido minimalista de largo midi con escote recto, breteles finos regulables y espalda baja. Confeccionado en lino pesado lavado a la piedra.",
    composition: "100% Lino Europeo",
    basePrice: 142000,
    discountPercentage: 0,
    weightInGrams: 390,
    isFeatured: true,
    categorySlug: "vestidos",
    skuPrefix: "VES-LIN",
    colors: ["Gris Piedra", "Blanco Off-White", "Negro"],
    sizes: ["XS", "S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  {
    name: "Trench Oversize Visón",
    slug: "trench-oversize-vison",
    description:
      "Trench clásico reinterpretado en gabardina impermeable de algodón con solapa tormenta, presillas en puños y lazo ajustable.",
    composition: "100% Gabardina de Algodón Hidrófugo",
    basePrice: 248000,
    discountPercentage: 10,
    weightInGrams: 920,
    isFeatured: true,
    categorySlug: "partes-de-arriba",
    skuPrefix: "TRE-VIS",
    colors: ["Beige Arena", "Chocolate"],
    sizes: ["S", "M", "L"],
    images: [
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
    ],
  },
];

async function main() {
  console.log("🌱 Iniciando seed de OL Indumenti (FW'26 - Neutral State)...");

  // 1. Usuario Admin
  const adminEmail = "admin@olecommerce.com.ar";
  const passwordHash = await bcrypt.hash("Admin1234!", 10);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: "Admin OL.",
      firstName: "Admin",
      lastName: "OL Indumenti",
      passwordHash,
      documentNumber: "30123456789",
      phone: "+5491112345678",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // 2. Talles
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
    const record = await db.size.upsert({
      where: { name: s.name },
      update: { sortOrder: s.sortOrder },
      create: s,
    });
    sizesMap[s.name] = record.id;
  }

  // 3. Colores en paleta neutra
  const colorsData = [
    { name: "Negro", hexCode: "#18181B" },
    { name: "Blanco Off-White", hexCode: "#FAF8F5" },
    { name: "Beige Arena", hexCode: "#D8C3A5" },
    { name: "Chocolate", hexCode: "#4A3525" },
    { name: "Gris Piedra", hexCode: "#A8A29E" },
  ];

  const colorsMap: Record<string, string> = {};
  for (const c of colorsData) {
    const record = await db.color.upsert({
      where: { name: c.name },
      update: { hexCode: c.hexCode },
      create: c,
    });
    colorsMap[c.name] = record.id;
  }

  // 4. Colección y 4 Categorías Editoriales
  const collection = await db.collection.upsert({
    where: { slug: "neutral-state-fw26" },
    update: { name: "Neutral State FW'26", isActive: true },
    create: {
      name: "Neutral State FW'26",
      slug: "neutral-state-fw26",
      description:
        "Colección Otoño/Invierno 2026: sastrería minimalista, tejidos nobles y tonos tierra.",
      isActive: true,
    },
  });

  const categoriesSeed = [
    {
      name: "Partes de Arriba & Blazers",
      slug: "partes-de-arriba",
      description: "Blazers sastreros, tapados de lana, camisas y básicos.",
    },
    {
      name: "Denim & Pantalones",
      slug: "denim",
      description: "Jeans wide leg, pantalones de pinzas y cortes rectos.",
    },
    {
      name: "Tejidos & Esenciales",
      slug: "tejidos",
      description: "Sweaters de lana merino, cárdigans y punto grueso.",
    },
    {
      name: "Vestidos & Monocromo",
      slug: "vestidos",
      description: "Vestidos midi en lino, satén y siluetas fluidas.",
    },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesSeed) {
    const record = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
      },
    });
    categoriesMap[cat.slug] = record.id;
  }

  // 5. Inyección de los 10 productos Mock con 2 imágenes y variantes
  for (const item of MOCK_PRODUCTS) {
    const categoryId = categoriesMap[item.categorySlug];
    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        composition: item.composition,
        basePrice: item.basePrice,
        discountPercentage: item.discountPercentage,
        weightInGrams: item.weightInGrams,
        status: ProductStatus.ACTIVE,
        isFeatured: item.isFeatured,
        categoryId,
        collectionId: collection.id,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        composition: item.composition,
        careGuide:
          "Lavar con agua fría en ciclo delicado o limpieza en seco. Secar en plano a la sombra.",
        basePrice: item.basePrice,
        discountPercentage: item.discountPercentage,
        weightInGrams: item.weightInGrams,
        status: ProductStatus.ACTIVE,
        isFeatured: item.isFeatured,
        categoryId,
        collectionId: collection.id,
      },
    });

    // Reemplazar imágenes para asegurar las 2 fotos de hover editorial
    await db.productImage.deleteMany({
      where: { productId: product.id },
    });

    await db.productImage.createMany({
      data: [
        {
          productId: product.id,
          url: item.images[0],
          altText: `${item.name} — Vista Principal`,
          position: 0,
        },
        {
          productId: product.id,
          url: item.images[1],
          altText: `${item.name} — Vista Editorial Secundaria`,
          position: 1,
        },
      ],
    });

    // Crear variantes combinando colores y talles
    for (const colorName of item.colors) {
      const colorId = colorsMap[colorName];
      const colorCode = colorName
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X");

      for (const sizeName of item.sizes) {
        const sizeId = sizesMap[sizeName];
        const sku = `${item.skuPrefix}-${colorCode}-${sizeName.toUpperCase()}`;

        await db.productVariant.upsert({
          where: { sku },
          update: {
            stock: 8,
            isActive: true,
            imageUrl: item.images[0],
          },
          create: {
            sku,
            productId: product.id,
            sizeId,
            colorId,
            stock: 8,
            reservedStock: 0,
            imageUrl: item.images[0],
            isActive: true,
          },
        });
      }
    }

    console.log(`✅ Prenda inyectada: ${item.name} (${item.images.length} fotos)`);
  }

  console.log("🚀 Seed de 10 prendas editoriales completado con éxito.");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
