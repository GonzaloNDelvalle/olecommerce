import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/shop/InfoPage";
import { getSiteTexts } from "@/modules/content/site-texts";
import { textLines } from "@/modules/content/texts";
import { getStoreSettings } from "@/modules/settings/store-settings";

export const metadata: Metadata = {
  title: "Política de cambios y devoluciones",
  description: "Plazos, condiciones y pasos para cambiar o devolver una prenda de OL. Indumenti.",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

const h2 = "display text-[clamp(26px,3vw,40px)] text-ink";
const p = "text-[15px] leading-relaxed text-stone-700 max-w-[72ch]";
const link = "font-semibold text-ink underline underline-offset-4";

/** Los textos se editan en /admin/textos. */
export default async function ExchangePolicyPage() {
  const [settings, texts] = await Promise.all([getStoreSettings(), getSiteTexts()]);

  const paragraphs = (value: string) =>
    textLines(value).map((line) => (
      <p key={line} className={p}>
        {line}
      </p>
    ));

  return (
    <InfoPage eyebrow={texts["policy.eyebrow"]} title={texts["policy.title"]} intro={texts["policy.intro"]}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16">
        <section className="flex flex-col gap-3">
          <h2 className={h2}>{texts["policy.exchange.title"]}</h2>
          {paragraphs(texts["policy.exchange.text"])}
          <ul className={`${p} list-disc pl-5 marker:text-chocolate`}>
            {textLines(texts["policy.exchange.list"]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>{texts["policy.steps.title"]}</h2>
          <ol className={`${p} list-decimal pl-5 marker:font-semibold marker:text-chocolate`}>
            {textLines(texts["policy.steps.list"]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <Link href="/contacto" className={`${link} text-[15px]`}>
            Ir a contacto
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>{texts["policy.revocation.title"]}</h2>
          {paragraphs(texts["policy.revocation.text"])}
          <Link href="/arrepentimiento" className={`${link} text-[15px]`}>
            Ir al botón de arrepentimiento
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={h2}>{texts["policy.refunds.title"]}</h2>
          {paragraphs(texts["policy.refunds.text"])}
        </section>

        <section className="border-t border-stone-200 pt-8 lg:col-span-2">
          <p className={p}>
            ¿Dudas sobre una devolución? Escribinos a{" "}
            <a href={`mailto:${settings.supportEmail}`} className={link}>
              {settings.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </InfoPage>
  );
}
