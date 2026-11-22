"use server";

import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { applyDiscount } from "@/modules/orders/pricing";
import { mergeStockLines } from "@/modules/orders/inventory";
import { packageWeight, quoteShipping, type ShippingQuote } from "@/modules/orders/shipping-rates";
import { getActiveShippingMethods } from "@/modules/settings/store-settings";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const quoteInputSchema = z.object({
  postalCode: z.string().trim().max(10),
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});

export type ShippingQuotesResult = Record<string, ShippingQuote>;

/**
 * Cotiza todos los métodos de envío activos para un CP y un carrito. Usa los
 * precios y pesos de la base (no los del navegador). Solo lectura.
 */
export async function quoteShippingForCart(input: z.input<typeof quoteInputSchema>): Promise<ShippingQuotesResult> {
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) return {};
  if (!(await consumeRateLimit(RATE_LIMITS.shippingQuote))) return {};

  const items = mergeStockLines(parsed.data.items);
  const [methods, variants] = await Promise.all([
    getActiveShippingMethods(),
    db.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) }, isActive: true, product: { status: ProductStatus.ACTIVE } },
      select: {
        id: true,
        priceOverride: true,
        product: { select: { basePrice: true, discountPercentage: true, weightInGrams: true } },
      },
    }),
  ]);

  const byId = new Map(variants.map((v) => [v.id, v]));
  let subtotal = 0;
  const packageItems: { weightGrams: number; quantity: number }[] = [];
  for (const item of items) {
    const variant = byId.get(item.variantId);
    if (!variant) continue;
    const unit = applyDiscount(Number(variant.priceOverride ?? variant.product.basePrice), variant.product.discountPercentage ?? 0);
    subtotal += unit * item.quantity;
    packageItems.push({ weightGrams: variant.product.weightInGrams, quantity: item.quantity });
  }

  const result: ShippingQuotesResult = {};
  for (const method of methods) {
    result[method.id] = quoteShipping(method, {
      postalCode: parsed.data.postalCode,
      weightGrams: method.rateTable ? packageWeight(packageItems, method.rateTable) : 0,
      subtotal,
    });
  }
  return result;
}
