import { PaymentStatus } from "@prisma/client";

/**
 * Mapea el status string de MercadoPago al enum PaymentStatus de Prisma.
 */
export function mapMercadoPagoStatus(mpStatus?: string): PaymentStatus {
  switch (mpStatus) {
    case "approved":
      return PaymentStatus.APPROVED;
    case "authorized":
      return PaymentStatus.AUTHORIZED;
    case "in_process":
    case "in_mediation":
      return PaymentStatus.IN_PROCESS;
    case "rejected":
      return PaymentStatus.REJECTED;
    case "cancelled":
      return PaymentStatus.CANCELLED;
    case "refunded":
      return PaymentStatus.REFUNDED;
    case "charged_back":
      return PaymentStatus.CHARGED_BACK;
    default:
      return PaymentStatus.PENDING;
  }
}
