"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { sanitizeAnalyticsUrl } from "@/lib/analytics-privacy";

/**
 * Vercel Analytics y Speed Insights sin identificadores de orden en las URLs
 * que reportan (ver `sanitizeAnalyticsUrl`).
 */
export function VercelMetrics() {
  return (
    <>
      <Analytics
        beforeSend={(event) => ({ ...event, url: sanitizeAnalyticsUrl(event.url) })}
      />
      <SpeedInsights
        beforeSend={(event) => ({ ...event, url: sanitizeAnalyticsUrl(event.url) })}
      />
    </>
  );
}
