import { describe, expect, it } from "vitest";
import {
  filterActiveAnnouncements,
  isSafeAnnouncementLink,
  isTimeless,
  type AnnouncementDTO,
} from "./announcements";

const base = { linkUrl: null, startsAt: null, endsAt: null };
const now = new Date("2026-11-12T15:00:00.000Z");

const messages: AnnouncementDTO[] = [
  { ...base, id: "siempre", text: "Envío gratis" },
  {
    ...base,
    id: "hot-sale",
    text: "Hot Sale",
    startsAt: "2026-11-10T03:00:00.000Z",
    endsAt: "2026-11-13T03:00:00.000Z",
  },
  { ...base, id: "futuro", text: "Black Friday", startsAt: "2026-11-27T03:00:00.000Z" },
  { ...base, id: "vencido", text: "Cyber", endsAt: "2026-11-05T03:00:00.000Z" },
];

describe("filterActiveAnnouncements", () => {
  it("muestra los mensajes sin fechas y los de campañas vigentes", () => {
    expect(filterActiveAnnouncements(messages, now).map((m) => m.id)).toEqual([
      "siempre",
      "hot-sale",
    ]);
  });

  it("una campaña termina exactamente en su fecha de fin", () => {
    const end = new Date("2026-11-13T03:00:00.000Z");
    expect(filterActiveAnnouncements(messages, end).map((m) => m.id)).not.toContain(
      "hot-sale"
    );
  });

  it("solo los mensajes sin fechas se renderizan en el servidor", () => {
    expect(messages.filter(isTimeless).map((m) => m.id)).toEqual(["siempre"]);
  });
});

describe("isSafeAnnouncementLink", () => {
  it.each(["/productos", "/productos?categoria=denim", "https://instagram.com/olindumenti"])(
    "acepta %s",
    (href) => expect(isSafeAnnouncementLink(href)).toBe(true)
  );

  it.each(["javascript:alert(1)", "//evil.com", "http://inseguro.com", "productos"])(
    "rechaza %s",
    (href) => expect(isSafeAnnouncementLink(href)).toBe(false)
  );
});
