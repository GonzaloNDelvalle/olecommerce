"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { RevocationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export interface AdminRevocationDTO {
  id: string;
  code: string;
  orderId: string | null;
  orderNumber: number;
  email: string;
  reason: string | null;
  status: RevocationStatus;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export async function getAdminRevocations(): Promise<AdminRevocationDTO[]> {
  await requireAdmin();

  const requests = await db.revocationRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return requests.map((request) => ({
    id: request.id,
    code: request.code,
    orderId: request.orderId,
    orderNumber: request.orderNumber,
    email: request.email,
    reason: request.reason,
    status: request.status,
    adminNotes: request.adminNotes,
    createdAt: request.createdAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
  }));
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(RevocationStatus),
  adminNotes: z.string().trim().max(2000).optional(),
});

export async function updateAdminRevocation(
  input: z.input<typeof updateSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos." };
  }

  const { id, status, adminNotes } = parsed.data;
  const isClosed =
    status === RevocationStatus.RESOLVED || status === RevocationStatus.REJECTED;

  await db.revocationRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      resolvedAt: isClosed ? new Date() : null,
    },
  });

  revalidatePath("/admin/arrepentimientos");
  return { success: true };
}
