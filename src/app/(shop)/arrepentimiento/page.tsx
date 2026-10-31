import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { RevocationForm } from "@/modules/legal/components/RevocationForm";

export const metadata = {
  title: "Botón de Arrepentimiento | OL Indumenti",
  description:
    "Formulario de revocación de compra conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior y Ley de Defensa del Consumidor.",
};

export default function RevocationPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#FAF9F6]">
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-xs tracking-wider uppercase text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la tienda
          </Link>
        </div>

        <header className="mb-10 text-center">
          <p className="font-serif text-3xl tracking-tight text-stone-900">
            OL.
          </p>
          <h1 className="mt-4 font-serif text-3xl tracking-wide uppercase text-stone-900 sm:text-4xl">
            Botón de Arrepentimiento
          </h1>
          <p className="mt-3 font-sans text-xs uppercase tracking-[0.2em] text-stone-500">
            Defensa de las y los Consumidores · Res. 424/2020
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-stone-600 font-sans text-xs font-light">
            <ShieldCheck className="h-4 w-4 text-stone-800" />
            <span>Plazo legal de 10 días corridos desde la recepción del producto</span>
          </div>
        </header>

        <section className="mb-8 font-sans text-xs font-light leading-relaxed text-stone-600 bg-white/70 border border-stone-200 p-5 rounded-none">
          <p>
            De conformidad con el <strong>artículo 34 de la Ley N° 24.240</strong> y la{" "}
            <strong>Resolución 424/2020</strong> de la Secretaría de Comercio Interior de la Nación,
            las clientas tienen derecho a revocar la aceptación del producto comprado dentro del plazo de{" "}
            <strong>diez (10) días corridos</strong> contados a partir de la fecha en que se entregó el bien o se celebró el contrato.
          </p>
          <p className="mt-2 text-stone-500">
            No necesitás registrarte ni iniciar sesión. Al ingresar tu correo y número de pedido, nuestro equipo se pondrá en contacto dentro de las 24 horas hábiles para coordinar el retiro sin costo de logística a tu cargo.
          </p>
        </section>

        <RevocationForm />
      </div>
    </main>
  );
}
