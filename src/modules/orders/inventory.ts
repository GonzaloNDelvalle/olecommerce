import type { Prisma } from "@prisma/client";

/**
 * Operaciones de inventario atómicas a nivel SQL.
 *
 * Todas usan un único `UPDATE ... WHERE` condicionado, de modo que dos compras
 * concurrentes de la última unidad no puedan pasar ambas: Postgres bloquea la
 * fila y la segunda re-evalúa la condición con el valor ya actualizado.
 *
 * Deben ejecutarse dentro de una transacción (`db.$transaction(async (tx) => ...)`).
 */

type Tx = Prisma.TransactionClient;

export interface StockLine {
  variantId: string;
  quantity: number;
}

/**
 * Reserva `quantity` unidades si hay stock disponible (`stock - reserved_stock`).
 * Devuelve `false` si no alcanzó (no modifica nada en ese caso).
 */
export async function reserveVariantStock(
  tx: Tx,
  variantId: string,
  quantity: number
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "product_variants"
    SET "reserved_stock" = "reserved_stock" + ${quantity},
        "updated_at" = NOW()
    WHERE "id" = ${variantId}::uuid
      AND "is_active" = true
      AND "stock" - "reserved_stock" >= ${quantity}
  `;
  return affected === 1;
}

/**
 * Libera las unidades reservadas de una orden que no se pagó (cancelada / vencida).
 */
export async function releaseReservedStock(
  tx: Tx,
  lines: StockLine[]
): Promise<void> {
  for (const line of lines) {
    await tx.$executeRaw`
      UPDATE "product_variants"
      SET "reserved_stock" = GREATEST("reserved_stock" - ${line.quantity}, 0),
          "updated_at" = NOW()
      WHERE "id" = ${line.variantId}::uuid
    `;
  }
}

/**
 * Convierte una reserva en venta: descuenta el stock físico y la reserva.
 * Se usa cuando una orden PENDING pasa a PAID.
 */
export async function commitReservedStock(
  tx: Tx,
  lines: StockLine[]
): Promise<void> {
  for (const line of lines) {
    await tx.$executeRaw`
      UPDATE "product_variants"
      SET "stock" = GREATEST("stock" - ${line.quantity}, 0),
          "reserved_stock" = GREATEST("reserved_stock" - ${line.quantity}, 0),
          "updated_at" = NOW()
      WHERE "id" = ${line.variantId}::uuid
    `;
  }
}

/**
 * Descuenta stock disponible SIN reserva previa (ej.: llegó un pago aprobado
 * para una orden que ya se había cancelado y liberado su reserva).
 * Devuelve `false` si alguna variante no tiene unidades suficientes; en ese caso
 * la transacción debe abortarse para no dejar descuentos parciales.
 */
export async function takeAvailableStock(
  tx: Tx,
  variantId: string,
  quantity: number
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "product_variants"
    SET "stock" = "stock" - ${quantity},
        "updated_at" = NOW()
    WHERE "id" = ${variantId}::uuid
      AND "stock" - "reserved_stock" >= ${quantity}
  `;
  return affected === 1;
}

/** Agrupa líneas repetidas de la misma variante sumando cantidades. */
export function mergeStockLines<T extends StockLine>(lines: T[]): T[] {
  const merged = new Map<string, T>();
  for (const line of lines) {
    const current = merged.get(line.variantId);
    if (current) {
      merged.set(line.variantId, {
        ...current,
        quantity: current.quantity + line.quantity,
      });
    } else {
      merged.set(line.variantId, { ...line });
    }
  }
  return [...merged.values()];
}
