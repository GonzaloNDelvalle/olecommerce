import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/shop/InfoPage";
import { getStoreSettings } from "@/modules/settings/store-settings";

export const metadata: Metadata = {
  title: "Política de cambios y devoluciones",
  description: "Plazos, condiciones y pasos para cambiar o devolver una prenda de OL. Indumenti.",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

/**
 * Plazos de la política. REVISAR con el negocio antes de publicar: el único
 * plazo legal es el de arrepentimiento (10 días, Ley 24.240 art. 34).
 */
const EXCHANGE_DAYS = 30;
const REVOCATION_DAYS = 10;

const h2 = "display text-[clamp(26px,3vw,34px)] leading-tight text-ink";
const p = "text-[15px] leading-relaxed text-stone-700 max-w-[62ch]";

export default async function ExchangePolicyPage() {
  const settings = await getStoreSettings();

  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Cambios y devoluciones"
      intro="Queremos que estés conforme con tu compra. Estas son las condiciones y los pasos para cambiar o devolver una prenda."
    >
      <div className="flex flex-col gap-12">
        <section className="flex flex-col gap-3">
          <h2 className={h2}>Cambios</h2>
          <p className={p}>
            Podés cambiar una prenda por otro talle o color dentro de los {EXCHANGE_DAYS} días corridos de
            recibida, sujeto a disponibilidad de stock.
          </p>
          <ul className={`${p} list-disc pl-5 marker:text-caramel`}>
            <li>La prenda debe estar sin uso, sin lavar y con sus etiquetas originales.</li>
            <li>Los productos en liquidación o con descuento especial pueden tener condiciones distintas, que se informan en la ficha.</li>
            <li>Si el cambio se debe a un error nuestro (producto equivocado o con falla), el envío corre por nuestra cuenta.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>Cómo pedir un cambio</h2>
          <ol className={`${p} list-decimal pl-5 marker:font-semibold marker:text-caramel`}>
            <li>
              Escribinos desde{" "}
              <Link href="/contacto" className="font-semibold text-ink underline underline-offset-4">
                Contacto
              </Link>{" "}
              con tu número de pedido y qué prenda querés cambiar.
            </li>
            <li>Te confirmamos disponibilidad y te indicamos cómo enviarnos la prenda.</li>
            <li>Cuando la recibimos y la revisamos, despachamos tu nuevo talle o color.</li>
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>Botón de arrepentimiento</h2>
          <p className={p}>
            Según la Ley de Defensa del Consumidor (art. 34 de la Ley 24.240 y Res. 424/2020), podés revocar tu
            compra dentro de los {REVOCATION_DAYS} días corridos desde que recibiste el producto. Hacelo desde el{" "}
            <Link href="/arrepentimiento" className="font-semibold text-ink underline underline-offset-4">
              botón de arrepentimiento
            </Link>{" "}
            y coordinamos el retiro sin costo de logística a tu cargo.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>Reintegros</h2>
          <p className={p}>
            Los reintegros se hacen por el mismo medio de pago con el que compraste, una vez que recibimos y
            revisamos la prenda. El plazo en que se acredita depende de tu banco o tarjeta.
          </p>
        </section>

        <section className="flex flex-col gap-2 border-t border-stone-200 pt-8">
          <p className={p}>
            ¿Dudas sobre una devolución? Escribinos a{" "}
            <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-ink underline underline-offset-4">
              {settings.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
