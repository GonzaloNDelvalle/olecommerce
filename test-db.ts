import "dotenv/config";
import { db } from "./src/lib/db";

async function verifySingletonDb() {
  console.log("=== Verificación Aislada de src/lib/db.ts (Singleton + PrismaNeon WSS:443) ===");
  const start = Date.now();
  try {
    const product = await db.product.findFirst({
      include: {
        category: true,
        variants: true,
      },
    });
    console.log(
      `[OK] db.product.findFirst() respondió en ${Date.now() - start}ms:`
    );
    console.log({
      id: product?.id,
      name: product?.name,
      category: product?.category?.name,
      variantsCount: product?.variants.length,
    });
  } catch (error) {
    console.error("[ERROR] Falló la consulta:", error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

verifySingletonDb();
