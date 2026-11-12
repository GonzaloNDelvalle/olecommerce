import { NewsletterStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/lib/auth-guards";

/** Evita que una celda que empieza con =, +, - o @ se ejecute como fórmula en Excel. */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Exporta las suscriptoras activas en CSV (para Mailchimp, Resend Audiences,
 * Brevo, etc.). Solo administradoras.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response("No autorizado", { status: 401 });
    }
    throw error;
  }

  const subscribers = await db.newsletterSubscriber.findMany({
    where: { status: NewsletterStatus.SUBSCRIBED },
    orderBy: { consentAt: "asc" },
    select: { email: true, consentAt: true, source: true },
  });

  const lines = [
    ["email", "fecha_suscripcion", "origen"].join(","),
    ...subscribers.map((s) =>
      [csvCell(s.email), csvCell(s.consentAt.toISOString()), csvCell(s.source)].join(",")
    ),
  ];

  const date = new Date().toISOString().slice(0, 10);
  // BOM para que Excel reconozca los acentos (UTF-8)
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
