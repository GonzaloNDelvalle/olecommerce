/**
 * Lógica pura de la barra de anuncios (sin base de datos), compartida entre
 * el servidor y el componente del navegador.
 */

export interface AnnouncementDTO {
  id: string;
  text: string;
  linkUrl: string | null;
  /** ISO 8601 o null */
  startsAt: string | null;
  endsAt: string | null;
}

/** Mensajes vigentes en un momento dado (respeta las fechas de campaña). */
export function filterActiveAnnouncements(
  messages: AnnouncementDTO[],
  now: Date
): AnnouncementDTO[] {
  const time = now.getTime();
  return messages.filter((message) => {
    if (message.startsAt && new Date(message.startsAt).getTime() > time) {
      return false;
    }
    if (message.endsAt && new Date(message.endsAt).getTime() <= time) {
      return false;
    }
    return true;
  });
}

/** Un mensaje sin fechas se puede mostrar ya en el HTML del servidor. */
export function isTimeless(message: AnnouncementDTO): boolean {
  return !message.startsAt && !message.endsAt;
}

/** Solo links internos o https (evita `javascript:` y similares). */
export function isSafeAnnouncementLink(href: string): boolean {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}
