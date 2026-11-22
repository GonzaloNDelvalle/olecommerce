import { expect, test, type Page } from "@playwright/test";
import { e2eEnv, getDb, isolated, pickVariant, resetInventory, resetRateLimits } from "./helpers/db";

/**
 * Pruebas que ESCRIBEN datos: órdenes, stock, newsletter, arrepentimiento y cron.
 * Solo corren contra la rama de pruebas de Neon (`.env.e2e`, ver playwright.config.ts):
 * si la base es la misma que la del `.env`, se saltean. Mercado Pago y Resend usan
 * credenciales falsas, así que nunca se cobra ni se envía un email real.
 */

test.skip(!isolated, "Requiere .env.e2e apuntando a una base distinta a la del .env");
test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

type PickedVariant = Awaited<ReturnType<typeof pickVariant>>;
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Solo el proyecto de escritorio escribe: si el de móvil también reiniciara el
// inventario, lo haría en medio de la corrida del otro.
test.beforeAll(async ({}, workerInfo) => {
  if (isolated && workerInfo.project.name === "desktop") await resetInventory();
});

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Los tests con escritura corren solo en escritorio");
  await resetRateLimits();
});

async function addVariantToCart(page: Page, variant: PickedVariant) {
  await page.goto(`/productos/${variant.product.slug}`);
  await page.getByRole("radio", { name: variant.color.name, exact: true }).click();
  await page.getByRole("radio", { name: variant.size.name, exact: true }).click();
  await page.getByRole("button", { name: /agregar al carrito/i }).click();
  await expect(page.getByRole("dialog")).toContainText(/tu carrito \(1\)/i);
}

async function fillCheckout(page: Page, email: string) {
  await page.goto("/checkout");
  await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
  await page.getByLabel(/correo electrónico/i).fill(email);
  await page.getByLabel(/nombre/i).first().fill("Prueba");
  await page.getByLabel(/apellido/i).fill("Automática");
  await page.getByLabel(/dni o cuil/i).fill("30111222");
  await page.getByLabel(/teléfono/i).fill("1155550000");
  await page.getByLabel(/calle/i).fill("Calle Falsa");
  await page.getByLabel(/altura/i).fill("123");
  await page.getByLabel(/código postal/i).fill("1425");
  await page.getByLabel(/localidad/i).fill("Palermo");
}

/** Compra completa por transferencia; devuelve el ID de la orden creada. */
async function placeTransferOrder(page: Page, variant: PickedVariant, email = `e2e-${stamp()}@e2e.test`) {
  await addVariantToCart(page, variant);
  await fillCheckout(page, email);
  await page.getByRole("button", { name: /transferencia bancaria/i }).click();
  await page.getByRole("button", { name: /confirmar pedido por transferencia/i }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmacion\/[0-9a-f-]{36}/, { timeout: 60_000 });
  return page.url().match(/confirmacion\/([0-9a-f-]{36})/)![1];
}

async function stockOf(variantId: string) {
  const db = await getDb();
  const v = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  return { stock: v.stock, reserved: v.reservedStock };
}

test.describe("orden por transferencia", () => {
  test("crea la orden con totales correctos, reserva stock y no expone datos personales", async ({ page }) => {
    const db = await getDb();
    const variant = await pickVariant();
    const before = await stockOf(variant.id);
    const email = `e2e-${stamp()}@e2e.test`;

    const orderId = await placeTransferOrder(page, variant, email);

    // Recibo: número de orden, datos bancarios, sin DNI ni email completo
    const receipt = page.locator("article").first();
    await expect(receipt).toContainText(/orden #\d+/i);
    await expect(receipt).not.toContainText("30111222");
    await expect(receipt).not.toContainText(email);

    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].variantId).toBe(variant.id);
    expect(order.payment?.provider).toBe("BANK_TRANSFER");

    const subtotal = Number(order.subtotal);
    const discount = Number(order.discountAmount);
    const shipping = Number(order.shippingCost);
    expect(discount).toBeGreaterThan(0); // 15 % por transferencia
    expect(shipping).toBe(subtotal >= 250000 ? 0 : 9500); // costo calculado en el servidor
    expect(Number(order.totalAmount)).toBeCloseTo(subtotal - discount + shipping, 2);

    const after = await stockOf(variant.id);
    expect(after.reserved).toBe(before.reserved + 1);
    expect(after.stock).toBe(before.stock);
  });

  test("el cron vence una orden impaga y libera el stock reservado", async ({ page, request }) => {
    const db = await getDb();
    const secret = e2eEnv().CRON_SECRET;
    const variant = await pickVariant();
    const orderId = await placeTransferOrder(page, variant);
    const reservedWithOrder = (await stockOf(variant.id)).reserved;

    // Sin el secreto, el cron rechaza el pedido
    expect((await request.get("/api/cron/expire-orders")).status()).toBe(401);
    expect(
      (await request.get("/api/cron/expire-orders", { headers: { authorization: "Bearer incorrecto" } })).status()
    ).toBe(401);

    // La orden "tiene" 10 días: ya pasó el plazo de la transferencia
    await db.order.update({ where: { id: orderId }, data: { createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000) } });
    const response = await request.get("/api/cron/expire-orders", { headers: { authorization: `Bearer ${secret}` } });
    expect(response.status()).toBe(200);

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("CANCELLED");
    expect((await stockOf(variant.id)).reserved).toBe(reservedWithOrder - 1);
  });

  test("el admin acredita el pago manual: la orden pasa a pagada y se descuenta el stock", async ({ page, browser, baseURL }) => {
    const db = await getDb();
    const env = e2eEnv();
    const variant = await pickVariant();
    const before = await stockOf(variant.id);
    const orderId = await placeTransferOrder(page, variant);

    // Un cliente sin sesión no puede ver la orden en el admin
    const guest = await browser.newContext({ baseURL });
    const guestPage = await guest.newPage();
    await guestPage.goto(`/admin/ordenes/${orderId}`);
    await expect(guestPage).toHaveURL(/\/login/);
    await guest.close();

    // Login del admin de pruebas
    await page.goto("/login");
    await page.locator("#email").fill(env.SEED_ADMIN_EMAIL);
    await page.locator("#password").fill(env.SEED_ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto(`/admin/ordenes/${orderId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /acreditar pago manual/i }).click();

    await expect
      .poll(async () => (await db.order.findUniqueOrThrow({ where: { id: orderId } })).status, { timeout: 30_000 })
      .toBe("PAID");
    const after = await stockOf(variant.id);
    expect(after.stock).toBe(before.stock - 1);
    expect(after.reserved).toBe(before.reserved);
  });
});

test.describe("Mercado Pago y webhook (credenciales falsas)", () => {
  test("si Mercado Pago falla: mensaje genérico, orden cancelada y stock liberado al instante", async ({ page }) => {
    const db = await getDb();
    const variant = await pickVariant();
    const before = await stockOf(variant.id);
    const email = `e2e-${stamp()}@e2e.test`;
    await addVariantToCart(page, variant);
    await fillCheckout(page, email);
    await page.getByRole("button", { name: /pagar con mercado pago/i }).click();

    const alert = page.getByText(/no se pudo generar el link de pago/i);
    await expect(alert).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/checkout$/);
    // Sin detalles internos del SDK ni credenciales
    await expect(page.locator("main")).not.toContainText(/TEST-|unauthorized|invalid_token|access_token|status.?code/i);

    // La orden no queda colgada reservando prendas: se cancela y el stock vuelve
    const user = await db.user.findUnique({ where: { email }, include: { orders: true } });
    expect(user?.orders).toHaveLength(1);
    expect(user?.orders[0].status).toBe("CANCELLED");
    expect(await stockOf(variant.id)).toEqual(before);

    // Reintentar no acumula reservas
    await page.getByRole("button", { name: /pagar con mercado pago/i }).click();
    await expect(alert).toBeVisible({ timeout: 60_000 });
    expect(await stockOf(variant.id)).toEqual(before);
  });

  test("el webhook ignora IDs inválidos, responde al ping y no filtra errores internos", async ({ request }) => {
    const invalid = await request.post("/api/webhooks/mercadopago?type=payment&data.id=abc");
    expect(invalid.status()).toBe(200);
    expect(await invalid.json()).toEqual({ received: true });

    const ping = await request.post("/api/webhooks/mercadopago?type=payment&data.id=123456");
    expect(ping.status()).toBe(200);
    expect(await ping.json()).toMatchObject({ message: expect.stringMatching(/test webhook/i) });

    const other = await request.post("/api/webhooks/mercadopago?type=merchant_order&data.id=999");
    expect(other.status()).toBe(200);

    // ID válido, pero con credenciales falsas Mercado Pago no confirma el pago:
    // nunca se acredita nada y el error no revela detalles
    const unverifiable = await request.post("/api/webhooks/mercadopago?type=payment&data.id=987654321");
    expect(unverifiable.status()).toBe(500);
    expect(JSON.stringify(await unverifiable.json())).not.toMatch(/TEST-|token|stack/i);
  });
});

test.describe("stock", () => {
  test("dos compras simultáneas de la última unidad: solo una prospera", async ({ page, browser, baseURL }) => {
    const db = await getDb();
    const variant = await pickVariant();
    const original = await stockOf(variant.id);
    await db.productVariant.update({ where: { id: variant.id }, data: { stock: original.reserved + 1 } });

    try {
      const buyers = await Promise.all(
        [0, 1].map(async (n) => {
          const context = n === 0 ? page.context() : await browser.newContext({ baseURL });
          const buyerPage = n === 0 ? page : await context.newPage();
          await addVariantToCart(buyerPage, variant);
          await fillCheckout(buyerPage, `e2e-${stamp()}-${n}@e2e.test`);
          await buyerPage.getByRole("button", { name: /transferencia bancaria/i }).click();
          return buyerPage;
        })
      );

      // Se confirman a la vez
      await Promise.all(
        buyers.map((p) => p.getByRole("button", { name: /confirmar pedido por transferencia/i }).click())
      );

      const outcomes = await Promise.all(
        buyers.map((p) =>
          Promise.race([
            p.waitForURL(/\/checkout\/confirmacion\//, { timeout: 60_000 }).then(() => "compró"),
            p.getByText(/stock insuficiente/i).waitFor({ timeout: 60_000 }).then(() => "sin stock"),
          ])
        )
      );
      expect(outcomes.filter((o) => o === "compró")).toHaveLength(1);
      expect(outcomes.filter((o) => o === "sin stock")).toHaveLength(1);

      const final = await stockOf(variant.id);
      expect(final.reserved).toBe(original.reserved + 1);
      expect(final.stock - final.reserved).toBe(0); // nunca se reserva más de lo que hay
    } finally {
      // Se restauran las dos cifras juntas (la base exige reservado <= stock)
      await db.productVariant.update({
        where: { id: variant.id },
        data: { stock: original.stock, reservedStock: original.reserved },
      });
    }
  });
});

test.describe("newsletter con doble confirmación", () => {
  test("la suscripción queda pendiente hasta confirmar desde el link", async ({ page }) => {
    const db = await getDb();
    const email = `news-${stamp()}@e2e.test`;

    await page.goto("/");
    const input = page.locator("#newsletter-email");
    await input.scrollIntoViewIfNeeded();
    await input.fill(email);
    await input.press("Enter");
    await expect(page.getByText(/te enviamos un email para confirmar/i)).toBeVisible({ timeout: 30_000 });

    const pending = await db.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(pending.status).toBe("PENDING");
    expect(pending.confirmToken).toMatch(/^[a-f0-9]{48}$/);

    // Reintentar enseguida no genera otro link
    await page.goto("/");
    await page.locator("#newsletter-email").fill(email);
    await page.locator("#newsletter-email").press("Enter");
    await expect(page.getByText(/te enviamos un email para confirmar/i)).toBeVisible({ timeout: 30_000 });
    expect((await db.newsletterSubscriber.findUniqueOrThrow({ where: { email } })).confirmToken).toBe(
      pending.confirmToken
    );

    // Un token inventado no confirma nada
    await page.goto("/newsletter/confirmar?token=" + "0".repeat(48));
    await page.getByRole("button", { name: /confirmar suscripción/i }).click();
    await expect(page.getByText(/no es válido o ya fue usado/i)).toBeVisible();

    // El link real sí
    await page.goto(`/newsletter/confirmar?token=${pending.confirmToken}`);
    await page.getByRole("button", { name: /confirmar suscripción/i }).click();
    await expect(page.getByText(/ya formás parte/i)).toBeVisible({ timeout: 30_000 });

    const active = await db.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(active.status).toBe("SUBSCRIBED");
    expect(active.confirmToken).toBeNull();

    // El link no se puede reutilizar
    await page.goto(`/newsletter/confirmar?token=${pending.confirmToken}`);
    await page.getByRole("button", { name: /confirmar suscripción/i }).click();
    await expect(page.getByText(/no es válido o ya fue usado/i)).toBeVisible();
  });
});

test.describe("botón de arrepentimiento", () => {
  test("registra la solicitud, responde igual exista o no el pedido y limita por email", async ({ page }) => {
    const db = await getDb();
    const email = `arr-${stamp()}@e2e.test`;

    const submit = async () => {
      await page.goto("/arrepentimiento");
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="orderNumber"]').fill("999999");
      await page.locator('button[type="submit"]').click();
    };

    await submit();
    await expect(page.getByText(/registramos tu solicitud con el código ARR-/i)).toBeVisible({ timeout: 30_000 });
    const saved = await db.revocationRequest.findFirstOrThrow({ where: { email } });
    expect(saved.orderId).toBeNull(); // el pedido no existe: se registra igual, sin enviar constancia a ese email

    // 2 solicitudes más entran; la cuarta del día con el mismo email se rechaza
    for (let i = 0; i < 2; i++) {
      await submit();
      await expect(page.getByText(/registramos tu solicitud/i)).toBeVisible({ timeout: 30_000 });
    }
    await submit();
    await expect(page.getByText(/varias solicitudes con este email hoy/i)).toBeVisible({ timeout: 30_000 });
    expect(await db.revocationRequest.count({ where: { email } })).toBe(3);
  });
});
