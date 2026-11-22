"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sanitizeAnalyticsUrl } from "@/lib/analytics-privacy";

/**
 * Envía a GA4 un `page_view` por cada navegación, con la URL sin UUID ni
 * `orderId`. Reemplaza al page_view automático de gtag (`send_page_view: false`),
 * que enviaría la URL real de la confirmación de compra.
 */
export function GaPageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const location = sanitizeAnalyticsUrl(window.location.href);
    const path = sanitizeAnalyticsUrl(`${pathname}${search ? `?${search}` : ""}`);
    try {
      window.gtag?.("event", "page_view", {
        page_location: location,
        page_path: path,
        page_title: document.title,
      });
    } catch {
      // La analítica nunca debe romper la página
    }
  }, [pathname, search]);

  return null;
}
