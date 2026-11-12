"use server";

import { NewsletterStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export interface AdminSubscriberDTO {
  id: string;
  email: string;
  status: NewsletterStatus;
  source: string;
  consentAt: string;
  unsubscribedAt: string | null;
}

export interface AdminNewsletterOverviewDTO {
  subscribedCount: number;
  unsubscribedCount: number;
  last30DaysCount: number;
  subscribers: AdminSubscriberDTO[];
}

export async function getAdminNewsletterOverview(): Promise<AdminNewsletterOverviewDTO> {
  await requireAdmin();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [subscribedCount, unsubscribedCount, last30DaysCount, rows] =
    await Promise.all([
      db.newsletterSubscriber.count({ where: { status: NewsletterStatus.SUBSCRIBED } }),
      db.newsletterSubscriber.count({ where: { status: NewsletterStatus.UNSUBSCRIBED } }),
      db.newsletterSubscriber.count({
        where: { status: NewsletterStatus.SUBSCRIBED, consentAt: { gte: since } },
      }),
      db.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

  return {
    subscribedCount,
    unsubscribedCount,
    last30DaysCount,
    subscribers: rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      source: row.source,
      consentAt: row.consentAt.toISOString(),
      unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
    })),
  };
}
