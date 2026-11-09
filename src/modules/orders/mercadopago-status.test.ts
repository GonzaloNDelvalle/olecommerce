import { describe, expect, it } from "vitest";
import { PaymentStatus } from "@prisma/client";
import { mapMercadoPagoStatus } from "./mercadopago-status";

describe("mapMercadoPagoStatus", () => {
  it.each([
    ["approved", PaymentStatus.APPROVED],
    ["authorized", PaymentStatus.AUTHORIZED],
    ["in_process", PaymentStatus.IN_PROCESS],
    ["in_mediation", PaymentStatus.IN_PROCESS],
    ["rejected", PaymentStatus.REJECTED],
    ["cancelled", PaymentStatus.CANCELLED],
    ["refunded", PaymentStatus.REFUNDED],
    ["charged_back", PaymentStatus.CHARGED_BACK],
    ["pending", PaymentStatus.PENDING],
    [undefined, PaymentStatus.PENDING],
  ])("%s → %s", (input, expected) => {
    expect(mapMercadoPagoStatus(input)).toBe(expected);
  });
});
