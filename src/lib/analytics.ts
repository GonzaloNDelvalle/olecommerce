"use client";

import { track } from "@vercel/analytics";

/**
 * Eventos de e-commerce enviados a GA4, Meta Pixel y Vercel Analytics
 * (cada destino solo si está configurado).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // La analítica nunca debe romper la compra
  }
}

export function trackAddToCart(item: AnalyticsItem) {
  const value = item.price * item.quantity;
  safe(() =>
    window.gtag?.("event", "add_to_cart", {
      currency: "ARS",
      value,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_variant: item.variant,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    })
  );
  safe(() =>
    window.fbq?.("track", "AddToCart", {
      currency: "ARS",
      value,
      content_ids: [item.id],
      content_type: "product",
    })
  );
  safe(() => track("add_to_cart", { product: item.name, value }));
}

export function trackPurchase(order: {
  orderId: string;
  orderNumber: number;
  total: number;
  shipping: number;
  items: AnalyticsItem[];
}) {
  // Evita duplicar la conversión si la clienta recarga la página
  const key = `purchase-tracked:${order.orderId}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // Sin storage: se envía igual
  }

  safe(() =>
    window.gtag?.("event", "purchase", {
      transaction_id: String(order.orderNumber),
      currency: "ARS",
      value: order.total,
      shipping: order.shipping,
      items: order.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_variant: item.variant,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  );
  safe(() =>
    window.fbq?.("track", "Purchase", {
      currency: "ARS",
      value: order.total,
      content_ids: order.items.map((item) => item.id),
      content_type: "product",
    })
  );
  safe(() =>
    track("purchase", { order: order.orderNumber, value: order.total })
  );
}
