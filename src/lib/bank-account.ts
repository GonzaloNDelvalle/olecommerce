/**
 * Datos de la cuenta bancaria de OL Indumenti para pagos por Transferencia.
 * Fuente única compartida entre la pantalla `/checkout/transferencia/[id]` y los emails transaccionales.
 */
export const BANK_ACCOUNT_INFO = {
  bankName: "Banco Galicia — Cuenta Corriente en Pesos",
  accountHolder: "OLÉ INDUMENTARIA S.R.L.",
  cuit: "30-71849201-9",
  cbu: "0070099320000048192014",
  alias: "OLE.TIENDA.OFICIAL",
  whatsappNumber: "+54 9 11 2345-6789",
  supportEmail: "pagos@olecommerce.com.ar",
} as const;
