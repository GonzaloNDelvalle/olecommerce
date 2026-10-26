"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductStatus } from "@prisma/client";
import {
  Pencil,
  PauseCircle,
  PlayCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  deleteOrArchiveAdminProduct,
  toggleAdminProductStatus,
} from "@/modules/admin/actions/admin-products.actions";

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  currentStatus: ProductStatus;
}

export function ProductRowActions({
  productId,
  productName,
  currentStatus,
}: ProductRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus() {
    const nextStatus =
      currentStatus === ProductStatus.ACTIVE
        ? ProductStatus.ARCHIVED
        : ProductStatus.ACTIVE;

    startTransition(async () => {
      const result = await toggleAdminProductStatus(productId, nextStatus);
      if (!result.success) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `¿Confirmás dar de baja "${productName}"?\n\nSi la prenda tiene órdenes históricas se archivará (Soft Delete); si no tiene ventas se eliminará definitivamente.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteOrArchiveAdminProduct(productId);
      if (!result.success) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      {/* 1. Editar Prenda */}
      <Link
        href={`/admin/productos/${productId}/editar`}
        title="Editar producto y stock"
        className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span>Editar</span>
      </Link>

      {/* 2. Acción Rápida: Pausar / Activar */}
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={isPending}
        title={
          currentStatus === ProductStatus.ACTIVE
            ? "Pausar publicación (pasar a ARCHIVED)"
            : "Reactivar publicación (pasar a ACTIVE)"
        }
        className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-amber-500 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : currentStatus === ProductStatus.ACTIVE ? (
          <>
            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>Pausar</span>
          </>
        ) : (
          <>
            <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Activar</span>
          </>
        )}
      </button>

      {/* 3. Acción Rápida: Eliminar / Baja */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title="Eliminar o archivar prenda"
        className="inline-flex items-center justify-center rounded-md border border-stone-200 bg-white p-1.5 text-stone-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
