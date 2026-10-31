import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CurrentYear } from "@/components/layout/CurrentYear";

export function ShopFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 text-stone-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 border-b border-stone-200 pb-14 md:grid-cols-12">
          {/* Columna de Marca */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link
              href="/"
              className="font-serif text-3xl font-normal tracking-[0.18em] text-stone-900 uppercase transition-colors hover:text-[#5C4033]"
            >
              OL.
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-stone-500">
              OL Indumenti — Sastrería minimalista, tejidos nobles y siluetas
              atemporales diseñadas en Buenos Aires, Argentina.
            </p>
            <p className="mt-4 text-[11px] font-medium tracking-[0.22em] text-stone-400 uppercase">
              Neutral State • FW&apos;26
            </p>
          </div>

          {/* 1. Columna SHOP */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/productos"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Ver Todo
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?categoria=partes-de-arriba"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Sastrería &amp; Blazers
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?categoria=denim"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Denim &amp; Pantalones
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?categoria=tejidos"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Tejidos &amp; Sweaters
                </Link>
              </li>
              <li>
                <Link
                  href="/productos?categoria=vestidos"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Vestidos
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. Columna AYUDA */}
          <div className="md:col-span-3 lg:col-span-3">
            <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
              Ayuda
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/mi-cuenta"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Seguimiento de Pedidos
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Medios de Pago &amp; Transferencia (-15%)
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Acceso de Clientas
                </Link>
              </li>
              <li>
                <Link
                  href="/registro"
                  className="transition-colors hover:text-[#5C4033]"
                >
                  Crear Cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Columna COMUNIDAD / INSTAGRAM */}
          <div className="md:col-span-3 lg:col-span-2">
            <h3 className="text-[11px] font-semibold tracking-[0.24em] text-stone-900 uppercase">
              Comunidad
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#5C4033]"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#5C4033]"
                >
                  <span>Pinterest Archive</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#5C4033]"
                >
                  <span>TikTok Editorial</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-[11px] text-stone-400 sm:flex-row">
          <p>
            © <CurrentYear /> OL Indumenti. Todos los derechos reservados —
            República Argentina.
          </p>
          <div className="flex items-center gap-6">
            <span>Envíos a todo el país</span>
            <span>•</span>
            <span>Mercado Pago &amp; Transferencia Bancaria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
