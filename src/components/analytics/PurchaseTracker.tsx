"use client";

import { useEffect } from "react";
import { trackPurchase, type AnalyticsItem } from "@/lib/analytics";

/** Registra la conversión una sola vez cuando la orden quedó pagada. */
export function PurchaseTracker(props: {
  orderId: string;
  orderNumber: number;
  total: number;
  shipping: number;
  items: AnalyticsItem[];
}) {
  const { orderId, orderNumber, total, shipping, items } = props;

  useEffect(() => {
    trackPurchase({ orderId, orderNumber, total, shipping, items });
    // Se dispara una vez por orden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return null;
}
