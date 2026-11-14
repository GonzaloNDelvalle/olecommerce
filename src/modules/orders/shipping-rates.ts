import { z } from "zod";

/**
 * Cotización de envíos por código postal y peso (tablas de tarifas cargadas
 * en el admin, por ejemplo copiadas del tarifario de Andreani o Correo
 * Argentino). Funciones puras: las usa el servidor al crear la orden y al
 * cotizar en el checkout.
 *
 * Un método de envío sin tabla mantiene su precio fijo de siempre.
 */

export const weightBracketSchema = z.object({
  /** Peso máximo del paquete en gramos para este precio. */
  maxGrams: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const shippingZoneSchema = z.object({
  name: z.string().trim().min(1).max(80),
  /** Rangos de CP numérico de 4 dígitos, ambos inclusive: [[1000, 1499], [1600, 1899]]. */
  postalRanges: z
    .array(z.tuple([z.number().int().min(1000).max(9999), z.number().int().min(1000).max(9999)]))
    .min(1),
  brackets: z.array(weightBracketSchema).min(1),
  /** Recargo por cada kg (o fracción) por encima del último tramo. null = no se envía más pesado. */
  extraPerKg: z.number().nonnegative().nullable(),
});

export const rateTableSchema = z.object({
  zones: z.array(shippingZoneSchema).min(1),
  /** Peso del embalaje que se suma a cada paquete. */
  packagingGrams: z.number().int().nonnegative().default(150),
  /** Peso que se asume para productos sin peso cargado. */
  defaultItemGrams: z.number().int().positive().default(500),
});

export type WeightBracket = z.infer<typeof weightBracketSchema>;
export type ShippingZone = z.infer<typeof shippingZoneSchema>;
export type RateTable = z.infer<typeof rateTableSchema>;

/** Lee la tabla guardada en la base; si está mal formada se ignora (precio fijo). */
export function parseRateTable(value: unknown): RateTable | null {
  if (value === null || value === undefined) return null;
  const parsed = rateTableSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Código postal argentino a número de 4 dígitos.
 * Acepta el CP clásico ("1043") y el CPA ("C1043AAB", "c1043aab").
 */
export function parsePostalCode(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.trim().toUpperCase().match(/^[A-Z]?(\d{4})(?:[A-Z]{3})?$/);
  if (!match) return null;
  const code = Number(match[1]);
  return code >= 1000 ? code : null;
}

/** "1000-1499, 1600" → [[1000,1499],[1600,1600]]. Devuelve null si algo no se entiende. */
export function parsePostalRanges(text: string): [number, number][] | null {
  const parts = text
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const ranges: [number, number][] = [];
  for (const part of parts) {
    const m = part.match(/^(\d{4})\s*(?:-|a|–)\s*(\d{4})$|^(\d{4})$/i);
    if (!m) return null;
    const from = Number(m[1] ?? m[3]);
    const to = Number(m[2] ?? m[3]);
    if (from < 1000 || to < from) return null;
    ranges.push([from, to]);
  }
  return ranges;
}

export function formatPostalRanges(ranges: [number, number][]): string {
  return ranges.map(([from, to]) => (from === to ? `${from}` : `${from}-${to}`)).join(", ");
}

/** Peso del paquete: prendas (o el peso por defecto si no tienen) + embalaje. */
export function packageWeight(
  items: { weightGrams: number; quantity: number }[],
  table: Pick<RateTable, "packagingGrams" | "defaultItemGrams">,
): number {
  const goods = items.reduce(
    (acc, item) => acc + (item.weightGrams > 0 ? item.weightGrams : table.defaultItemGrams) * item.quantity,
    0,
  );
  return goods + table.packagingGrams;
}

export function findZone(table: RateTable, postalCode: number): ShippingZone | null {
  return table.zones.find((zone) => zone.postalRanges.some(([from, to]) => postalCode >= from && postalCode <= to)) ?? null;
}

/** Precio de una zona para un peso. null si supera el último tramo y no hay recargo por kg. */
export function priceForWeight(zone: ShippingZone, grams: number): number | null {
  const brackets = [...zone.brackets].sort((a, b) => a.maxGrams - b.maxGrams);
  const bracket = brackets.find((b) => grams <= b.maxGrams);
  if (bracket) return bracket.price;
  const last = brackets[brackets.length - 1];
  if (zone.extraPerKg === null) return null;
  return last.price + Math.ceil((grams - last.maxGrams) / 1000) * zone.extraPerKg;
}

export type ShippingQuote =
  | { available: true; cost: number; zoneName: string | null }
  | { available: false; reason: "postal_code_required" | "no_zone" | "too_heavy" };

export interface QuotableShippingRule {
  price: number;
  freeShippingThreshold: number | null;
  rateTable: RateTable | null;
}

/**
 * Costo de envío para un método. Con tabla: según CP y peso; sin tabla: precio
 * fijo. En ambos casos aplica el envío gratis por monto.
 */
export function quoteShipping(
  rule: QuotableShippingRule,
  params: { postalCode: string | null | undefined; weightGrams: number; subtotal: number },
): ShippingQuote {
  const freeShipping = rule.freeShippingThreshold !== null && params.subtotal >= rule.freeShippingThreshold;

  if (!rule.rateTable) {
    return { available: true, cost: freeShipping ? 0 : Math.max(0, rule.price), zoneName: null };
  }

  const code = parsePostalCode(params.postalCode);
  if (code === null) return { available: false, reason: "postal_code_required" };

  const zone = findZone(rule.rateTable, code);
  if (!zone) return { available: false, reason: "no_zone" };

  const price = priceForWeight(zone, params.weightGrams);
  if (price === null) return { available: false, reason: "too_heavy" };

  return { available: true, cost: freeShipping ? 0 : Math.round(price), zoneName: zone.name };
}

export const QUOTE_UNAVAILABLE_MESSAGES: Record<Exclude<ShippingQuote, { available: true }>["reason"], string> = {
  postal_code_required: "Ingresá tu código postal para cotizar este envío.",
  no_zone: "Este envío no llega a tu código postal.",
  too_heavy: "El paquete supera el peso máximo de este envío.",
};
