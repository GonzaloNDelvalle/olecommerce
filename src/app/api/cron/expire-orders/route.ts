import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireStalePendingOrders } from "@/modules/orders/order-expiration";

/**
 * Cron: vence órdenes PENDING impagas y libera su stock reservado.
 *
 * Vercel Cron lo invoca con `Authorization: Bearer <CRON_SECRET>` según
 * `vercel.json`. También puede llamarlo cualquier programador externo
 * (ej. cron-job.org) enviando ese mismo header.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireStalePendingOrders();

  console.log("[cron/expire-orders]", {
    cancelled: result.cancelled,
    failed: result.failed,
  });

  return NextResponse.json({
    cancelledCount: result.cancelled.length,
    cancelledOrderNumbers: result.cancelled,
    failed: result.failed,
  });
}
