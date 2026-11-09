import { describe, expect, it } from "vitest";
import { render } from "react-email";
import OrderConfirmedEmail from "./OrderConfirmedEmail";
import PaymentApprovedEmail from "./PaymentApprovedEmail";
import OrderShippedEmail from "./OrderShippedEmail";
import VerifyEmail from "./VerifyEmail";
import PasswordResetEmail from "./PasswordResetEmail";
import AdminAlertEmail from "./AdminAlertEmail";
import RevocationReceivedEmail from "./RevocationReceivedEmail";
import { PREVIEW_ORDER } from "./types";

describe("emails transaccionales", () => {
  it("la orden por transferencia incluye los datos bancarios y el total", async () => {
    const html = await render(<OrderConfirmedEmail order={PREVIEW_ORDER} />);
    expect(html).toContain("Orden Confirmada");
    expect(html).toContain(PREVIEW_ORDER.store.bankCbu!);
    expect(html).toContain(PREVIEW_ORDER.store.bankAlias!);
    expect(html).toContain("145.500");
    expect(html).toContain("Envío a domicilio");
  });

  it("la orden por Mercado Pago no muestra datos bancarios", async () => {
    const html = await render(
      <OrderConfirmedEmail order={{ ...PREVIEW_ORDER, isBankTransfer: false }} />
    );
    expect(html).not.toContain(PREVIEW_ORDER.store.bankCbu!);
  });

  it("escapa el contenido ingresado por usuarias", async () => {
    const html = await render(
      <OrderConfirmedEmail
        order={{ ...PREVIEW_ORDER, customerFirstName: "<script>alert(1)</script>" }}
      />
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("el pago acreditado y el despacho renderizan", async () => {
    expect(await render(<PaymentApprovedEmail order={PREVIEW_ORDER} />)).toContain(
      "Pago Acreditado"
    );
    const shipped = await render(<OrderShippedEmail order={PREVIEW_ORDER} />);
    expect(shipped).toContain(PREVIEW_ORDER.trackingCode!);
    expect(shipped).toContain("andreani.com");
  });

  it("los emails de cuenta llevan el link correcto", async () => {
    const verify = await render(
      <VerifyEmail firstName="Ana" verifyUrl="https://tienda.test/verificar-email?token=abc" />
    );
    expect(verify).toContain("https://tienda.test/verificar-email?token=abc");

    const reset = await render(
      <PasswordResetEmail
        firstName="Ana"
        resetUrl="https://tienda.test/restablecer-contrasena?token=xyz"
        isFirstPassword
      />
    );
    expect(reset).toContain("Creá tu contraseña");
  });

  it("la alerta y el arrepentimiento muestran sus datos", async () => {
    expect(
      await render(<AdminAlertEmail subject="Pago duplicado" lines={["Línea 1"]} />)
    ).toContain("Línea 1");
    expect(
      await render(
        <RevocationReceivedEmail code="ARR-TEST1234" orderNumber={7} supportEmail="a@b.com" />
      )
    ).toContain("ARR-TEST1234");
  });

  it("genera versión de texto plano", async () => {
    const text = await render(<OrderConfirmedEmail order={PREVIEW_ORDER} />, {
      plainText: true,
    });
    expect(text).toContain("Sweater Oslo");
    expect(text).not.toContain("<table");
  });
});
