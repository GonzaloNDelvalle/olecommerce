/**
 * Cálculos de precios del checkout. Funciones puras (sin base de datos), las
 * mismas que usa el servidor al crear la orden y la UI para mostrar totales.
 */

/** Precio con el % de descuento del producto, redondeado a pesos enteros. */
export function applyDiscount(price: number, discountPercentage: number): number {
  if (!discountPercentage || discountPercentage <= 0) return price;
  const pct = Math.min(discountPercentage, 100);
  return Math.round(price * (1 - pct / 100));
}

export type DeliveryType = "HOME_DELIVERY" | "PICKUP";

export interface ShippingRule {
  id: string;
  name: string;
  description: string | null;
  type: DeliveryType;
  price: number;
  /** Envío gratis cuando el subtotal llega a este monto (null = nunca) */
  freeShippingThreshold: number | null;
  estimatedDelivery: string | null;
  /** Provincias habilitadas; vacío = todo el país */
  provinces: string[];
}

export function isShippingAvailableFor(
  rule: Pick<ShippingRule, "provinces">,
  province: string
): boolean {
  return rule.provinces.length === 0 || rule.provinces.includes(province);
}

/** Costo de envío para un subtotal (ya con descuentos de producto). */
export function computeShippingCost(
  rule: Pick<ShippingRule, "price" | "freeShippingThreshold">,
  subtotal: number
): number {
  if (
    rule.freeShippingThreshold !== null &&
    subtotal >= rule.freeShippingThreshold
  ) {
    return 0;
  }
  return Math.max(0, rule.price);
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
}

/**
 * Totales de la orden. El descuento por transferencia se aplica sobre las
 * prendas, no sobre el envío.
 */
export function computeOrderTotals(params: {
  subtotal: number;
  shippingCost: number;
  isBankTransfer: boolean;
  bankTransferDiscountPercentage: number;
}): OrderTotals {
  const discountAmount = params.isBankTransfer
    ? Math.round(
        params.subtotal * (Math.max(0, params.bankTransferDiscountPercentage) / 100)
      )
    : 0;
  return {
    subtotal: params.subtotal,
    discountAmount,
    shippingCost: params.shippingCost,
    totalAmount: Math.max(
      0,
      params.subtotal - discountAmount + params.shippingCost
    ),
  };
}
