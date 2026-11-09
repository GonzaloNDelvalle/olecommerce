/** Datos que reciben las plantillas de email de órdenes. */

export interface EmailOrderItem {
  productName: string;
  sizeName: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface EmailStoreInfo {
  supportEmail: string;
  whatsappNumber: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankCuit: string | null;
  bankCbu: string | null;
  bankAlias: string | null;
}

export interface EmailOrderData {
  id: string;
  orderNumber: number;
  customerFirstName: string;
  customerEmail: string;
  isBankTransfer: boolean;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  items: EmailOrderItem[];
  shippingAddressLine: string;
  carrier: string | null;
  trackingCode: string | null;
  shippingMethodName: string | null;
  isPickup: boolean;
  store: EmailStoreInfo;
  /** Horas que se reservan las prendas al pagar por transferencia */
  transferReservationHours: number;
}

/** Orden de ejemplo para la vista previa (`pnpm email:dev`). */
export const PREVIEW_ORDER: EmailOrderData = {
  id: "00000000-0000-4000-8000-000000000000",
  orderNumber: 1042,
  customerFirstName: "Ana",
  customerEmail: "ana@example.com",
  isBankTransfer: true,
  subtotal: 160000,
  discountAmount: 24000,
  shippingCost: 9500,
  totalAmount: 145500,
  items: [
    {
      productName: "Sweater Oslo",
      sizeName: "M",
      colorName: "Beige Arena",
      quantity: 1,
      unitPrice: 106200,
      subtotal: 106200,
    },
    {
      productName: "Remera Basic Cream",
      sizeName: "S",
      colorName: "Blanco Off-White",
      quantity: 1,
      unitPrice: 53800,
      subtotal: 53800,
    },
  ],
  shippingAddressLine: "Av. Alvear 1850 — 3 A — Palermo, CABA — CP 1425",
  carrier: "Andreani",
  trackingCode: "360002345678901",
  shippingMethodName: "Envío a domicilio",
  isPickup: false,
  store: {
    supportEmail: "hola@olindumenti.com",
    whatsappNumber: "+54 9 11 2345-6789",
    bankName: "Banco Galicia — Cuenta Corriente en Pesos",
    bankAccountHolder: "OLÉ INDUMENTARIA S.R.L.",
    bankCuit: "30-71849201-9",
    bankCbu: "0070099320000048192014",
    bankAlias: "OLE.TIENDA.OFICIAL",
  },
  transferReservationHours: 72,
};
