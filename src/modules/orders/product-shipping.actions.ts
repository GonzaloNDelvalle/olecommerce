"use server";

import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { applyDiscount } from "@/modules/orders/pricing";
import { packageWeight, quoteShipping, type ShippingQuote } from "@/modules/orders/shipping-rates";
import { getActiveShippingMethods } from "@/modules/settings/store-settings";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const inputSchema = z.object({
  postalCode: z.string().trim().min(1).max(10),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export interface ProductShippingOption {
  id: string;
  name: string;
  type: "HOME_DELIVERY" | "PICKUP";
  estimatedDelivery: string | null;
  quote: ShippingQuote;
}

export type ProductShippingResult =
  | { success: true; options: ProductShippingOption[] }
  | { success: false; error: string };

/**
 * Cotiza el envío (y el retiro) de un producto para un código postal, desde la
 * ficha. Usa los mismos métodos y tarifas que el checkout, con precios y pesos
 * de la base. Solo lectura. Cuando se integre Andreani, solo cambia el cálculo
 * del costo dentro de `quoteShipping`.
 */
export async function quoteShippingForProduct(
  input: z.input<typeof inputSchema>
): Promise<ProductShippingResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Ingresá un código postal válido." };

  if (!(await consumeRateLimit(RATE_LIMITS.shippingQuote))) {
    return { success: false, error: "Hiciste muchas consultas seguidas. Probá de nuevo en un rato." };
  }

  const { postalCode, variantId, quantity } = parsed.data;
  const [methods, variant] = await Promise.all([
    getActiveShippingMethods(),
    db.productVariant.findFirst({
      where: { id: variantId, isActive: true, product: { status: ProductStatus.ACTIVE } },
      select: {
        priceOverride: true,
        product: { select: { basePrice: true, discountPercentage: true, weightInGrams: true } },
      },
    }),
  ]);
  if (!variant) return { success: false, error: "No encontramos el producto." };

  const unit = applyDiscount(
    Number(variant.priceOverride ?? variant.product.basePrice),
    variant.product.discountPercentage ?? 0
  );
  const subtotal = unit * quantity;
  const packageItems = [{ weightGrams: variant.product.weightInGrams, quantity }];

  const options = methods.map((method): ProductShippingOption => ({
    id: method.id,
    name: method.name,
    type: method.type,
    estimatedDelivery: method.estimatedDelivery,
    quote: quoteShipping(method, {
      postalCode,
      weightGrams: method.rateTable ? packageWeight(packageItems, method.rateTable) : 0,
      subtotal,
    }),
  }));

  return { success: true, options };
}
