import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InfoPage } from "@/components/shop/InfoPage";
import { JsonLd } from "@/modules/seo/json-ld";
import { getStoreSettings, isBankTransferAvailable } from "@/modules/settings/store-settings";

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

export default async function FaqPage() {
  const settings = await getStoreSettings();
  const transfer = isBankTransferAvailable(settings);

  const faqs: Faq[] = [
    {
      question: "¿Cómo compro?",
      answer:
        "Elegí tus prendas, seleccioná talle y color, sumalas al carrito y finalizá la compra. Para comprar necesitás crear una cuenta, así podés seguir tu pedido desde «Mis pedidos».",
    },
    {
      question: "¿Qué medios de pago aceptan?",
      answer: transfer
        ? `Mercado Pago (tarjetas de crédito y débito, dinero en cuenta y otros medios disponibles) y transferencia bancaria${
            settings.bankTransferDiscountPercentage > 0
              ? `, con ${settings.bankTransferDiscountPercentage}% de descuento`
              : ""
          }. Con transferencia, reservamos tu pedido por un tiempo limitado hasta que se acredite el pago.`
        : "Pagás con Mercado Pago: tarjetas de crédito y débito, dinero en cuenta y otros medios disponibles.",
    },
    {
      question: "¿Hacen envíos a todo el país?",
      answer:
        "Sí, enviamos a todo el país. El costo y el plazo se calculan en el checkout según tu código postal y el peso del pedido. También podés elegir retiro en el showroom si está disponible.",
    },
    {
      question: "¿Cómo sigo mi pedido?",
      answer:
        "Cuando despachamos tu pedido te enviamos un email con el transportista y el código de seguimiento. También podés ver el estado en «Mis pedidos».",
      link: { href: "/mi-cuenta", label: "Ir a mis pedidos" },
    },
    {
      question: "¿Cómo elijo mi talle?",
      answer:
        "Cada producto tiene su guía de talles en la ficha. Si seguís con dudas, escribinos con tu altura y talle habitual y te recomendamos.",
      link: { href: "/contacto", label: "Consultar por un talle" },
    },
    {
      question: "¿Puedo cambiar o devolver una prenda?",
      answer:
        "Sí. Tenés derecho a arrepentirte de tu compra dentro de los 10 días corridos de recibida, y aceptamos cambios por talle o color según las condiciones de nuestra política.",
      link: { href: "/cambios-y-devoluciones", label: "Ver política de cambios" },
    },
    {
      question: "¿Cómo cuido mis prendas?",
      answer:
        "En cada ficha de producto encontrás la composición y la guía de cuidado. Seguirla ayuda a que los tejidos y la sastrería duren mucho más.",
    },
  ];

  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Preguntas frecuentes"
      intro="Lo que más nos consultan. Si no encontrás tu respuesta, escribinos."
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
              <p className="max-w-[60ch]">{faq.answer}</p>
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
