"use client";

import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  filterActiveAnnouncements,
  isSafeAnnouncementLink,
  isTimeless,
  type AnnouncementDTO,
} from "@/modules/content/announcements";

/** Cuántos mensajes (repetidos) como mínimo tiene cada mitad de la cinta. */
const MIN_ITEMS_PER_HALF = 8;

function Message({ message }: { message: AnnouncementDTO }) {
  const link = message.linkUrl && isSafeAnnouncementLink(message.linkUrl) ? message.linkUrl : null;
  return link ? (
    <Link href={link} className="underline-offset-4 transition-colors hover:text-sand hover:underline">
      {message.text}
    </Link>
  ) : (
    <span>{message.text}</span>
  );
}

/**
 * Barra superior con los mensajes (envío gratis, cuotas, campañas) pasando en
 * carrusel continuo de derecha a izquierda. Se pausa al apuntar o enfocar.
 *
 * Los mensajes sin fechas salen en el HTML del servidor; los que tienen
 * fechas de campaña se evalúan en el navegador con la hora actual, así
 * aparecen y desaparecen solos.
 *
 * La cinta tiene dos mitades idénticas y se desplaza -50%: así el bucle no
 * muestra saltos. La segunda mitad es decorativa (aria-hidden). Con
 * "reducir movimiento" no se anima y se muestra el primer mensaje.
 */
export function AnnouncementBar({
  messages,
  rotateSeconds,
}: {
  messages: AnnouncementDTO[];
  /** Segundos que tarda en pasar cada mensaje: define la velocidad. */
  rotateSeconds: number;
}) {
  const hydrated = useHydrated();
  const visible = hydrated
    ? filterActiveAnnouncements(messages, new Date())
    : messages.filter(isTimeless);
  const count = visible.length;
  if (count === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_ITEMS_PER_HALF / count));
  const half = Array.from({ length: repeats }, () => visible).flat();
  const duration = Math.max(2, rotateSeconds) * half.length;

  const renderHalf = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center motion-reduce:hidden"
    >
      {half.map((message, index) => (
        <li key={`${message.id}-${index}`} className="flex items-center whitespace-nowrap">
          <Message message={message} />
          <span aria-hidden="true" className="mx-8 text-sand/60">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      role="region"
      aria-label="Novedades de la tienda"
      className="group flex h-9 items-center overflow-hidden bg-espresso text-xs font-medium tracking-[0.12em] text-cream uppercase"
    >
      {/* Con movimiento reducido: un único mensaje fijo, centrado */}
      <p className="hidden w-full truncate px-4 text-center motion-reduce:block">
        <Message message={visible[0]} />
      </p>

      <div
        className="flex w-max motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] motion-safe:group-hover:[animation-play-state:paused] motion-safe:group-focus-within:[animation-play-state:paused]"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {renderHalf(false)}
        {renderHalf(true)}
      </div>
    </div>
  );
}
