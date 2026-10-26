import { OrderStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; dotClassName: string }
> = {
  PENDING: {
    label: "Pendiente (Stock Reservado)",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dotClassName: "bg-amber-500",
  },
  PAID: {
    label: "Pagada (Acreditada)",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-600",
  },
  PROCESSING: {
    label: "En Preparación",
    className: "border-blue-200 bg-blue-50 text-blue-800",
    dotClassName: "bg-blue-600",
  },
  SHIPPED: {
    label: "Despachada",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dotClassName: "bg-indigo-600",
  },
  DELIVERED: {
    label: "Entregada",
    className: "border-stone-300 bg-stone-100 text-stone-800",
    dotClassName: "bg-stone-600",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} />
      {config.label}
    </span>
  );
}
