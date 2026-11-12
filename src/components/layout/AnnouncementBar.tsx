"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  filterActiveAnnouncements,
  isSafeAnnouncementLink,
  isTimeless,
  type AnnouncementDTO,
} from "@/modules/content/announcements";

/**
 * Barra superior con mensajes rotativos (envío gratis, cuotas, campañas).
 *
 * Los mensajes sin fechas salen en el HTML del servidor; los que tienen
 * fechas de campaña se evalúan en el navegador con la hora actual, así
 * aparecen y desaparecen solos.
 */
export function AnnouncementBar({
  messages,
  rotateSeconds,
}: {
  messages: AnnouncementDTO[];
  rotateSeconds: number;
}) {
  const hydrated = useHydrated();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const visible = hydrated
    ? filterActiveAnnouncements(messages, new Date())
    : messages.filter(isTimeless);
  const count = visible.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const ms = Math.max(2, rotateSeconds) * 1000 * (reducedMotion ? 2 : 1);
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, ms);
    return () => window.clearInterval(timer);
  }, [count, paused, rotateSeconds]);

  if (count === 0) return null;

  const current = visible[index % count];
  const content = (
    <span key={current.id} className="animate-[fade-in_400ms_ease-out]">
      {current.text}
    </span>
  );

  return (
    <div
      role="region"
      aria-label="Novedades de la tienda"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex h-9 items-center justify-center bg-stone-900 px-4 text-center text-[10px] font-light tracking-[0.22em] text-stone-100 uppercase sm:text-[11px]"
    >
      <p aria-live="polite" className="truncate">
        {current.linkUrl && isSafeAnnouncementLink(current.linkUrl) ? (
          <Link
            href={current.linkUrl}
            className="underline-offset-4 transition-colors hover:text-[#D2B48C] hover:underline"
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </p>
    </div>
  );
}
