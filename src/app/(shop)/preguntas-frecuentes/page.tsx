import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InfoPage } from "@/components/shop/InfoPage";
import { JsonLd } from "@/modules/seo/json-ld";
import { getStoreSettings, isBankTransferAvailable } from "@/modules/settings/store-settings";
import { getSiteTexts } from "@/modules/content/site-texts";
import { fillText, TEXT_DEFINITIONS } from "@/modules/content/texts";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, medios de pago, talles, cambios y devoluciones: las respuestas a las dudas más comunes.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

interface Faq {
  question: string;
  /** Texto plano (también se usa para los datos estructurados). */
  answer: string;
  link?: { href: string; label: string };
}

/** Enlace que acompaña a algunas respuestas. */
const LINKS: Record<number, Faq["link"]> = {
  4: { href: "/mi-cuenta", label: "Ir a mis pedidos" },
  5: { href: "/contacto", label: "Consultar por un talle" },
  6: { href: "/cambios-y-devoluciones", label: "Ver política de cambios" },
};

export default async function FaqPage() {
  const [settings, texts] = await Promise.all([getStoreSettings(), getSiteTexts()]);
  const discount = isBankTransferAvailable(settings) ? settings.bankTransferDiscountPercentage : 0;

  const faqs: Faq[] = ([1, 2, 3, 4, 5, 6, 7] as const)
    .map((n) => {
      let answer = texts[`faq.${n}.a`];
      // Sin descuento por transferencia, el texto original de pagos no aplica
      if (n === 2 && discount === 0 && answer === TEXT_DEFINITIONS["faq.2.a"].default) {
        answer = "Pagás con Mercado Pago: tarjetas de crédito y débito, dinero en cuenta y otros medios disponibles.";
      }
      return {
        question: texts[`faq.${n}.q`],
        answer: fillText(answer, { descuento: discount }),
        link: LINKS[n],
      };
    })
    .filter((faq) => faq.question && faq.answer);

  return (
    <InfoPage
      eyebrow={texts["faq.eyebrow"]}
      title={texts["faq.title"]}
      intro={texts["faq.intro"]}
    >
      <div className="divide-y divide-stone-200 border-y border-stone-200">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {faq.question}
              <Plus
                className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-45"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </summary>
            <div className="pb-5 text-[15px] leading-relaxed text-stone-700">
              <p className="max-w-[80ch] whitespace-pre-line">{faq.answer}</p>
              {faq.link && (
                <Link href={faq.link.href} className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
                  {faq.link.label}
                </Link>
              )}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-10 text-[15px] text-stone-700">
        ¿Sigue la duda?{" "}
        <Link href="/contacto" className="font-semibold text-ink underline underline-offset-4">
          Escribinos
        </Link>
        .
      </p>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />
    </InfoPage>
  );
}
