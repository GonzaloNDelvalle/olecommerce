import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CurrentYear } from "@/components/layout/CurrentYear";
import type { NavLink } from "@/components/layout/ShopHeader";

interface ShopFooterProps {
  collectionName: string;
  seasonLabel: string;
  categoryLinks: NavLink[];
  instagramUrl: string | null;
  whatsappNumber: string | null;
  supportEmail: string;
}

const linkClass = "text-cream transition-colors duration-150 hover:text-sand";
const headingClass = "eyebrow text-sand";

export function ShopFooter({
  collectionName,
  seasonLabel,
  categoryLinks,
  instagramUrl,
  whatsappNumber,
  supportEmail,
}: ShopFooterProps) {
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` : null;

  return (
    <footer className="bg-espresso pb-28 text-cream lg:pb-0">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-10 px-4 pt-16 pb-12 sm:px-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:pt-20">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <Link href="/" className="display text-5xl font-semibold tracking-normal text-cream">
            OL.
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-stone-300">
            Indumentaria atemporal: sastrería, tejidos y básicos en tonos tierra, diseñados en Buenos Aires.
          </p>
          <p className="eyebrow text-stone-400">{[collectionName, seasonLabel].filter(Boolean).join(" · ")}</p>
        </div>

        <nav aria-label="Tienda" className="flex min-w-0 flex-col gap-3 text-sm">
          <h2 className={headingClass}>Tienda</h2>
          <Link href="/productos" className={linkClass}>
            Ver todo
          </Link>
          {categoryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Ayuda" className="flex min-w-0 flex-col gap-3 text-sm">
          <h2 className={headingClass}>Ayuda</h2>
          <Link href="/mi-cuenta" className={linkClass}>
            Mis pedidos
          </Link>
          <Link href="/arrepentimiento" className={linkClass}>
            Botón de arrepentimiento
          </Link>
          <a href={`mailto:${supportEmail}`} className={`${linkClass} [overflow-wrap:anywhere]`}>
            {supportEmail}
          </a>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className={linkClass}>
              WhatsApp
            </a>
          )}
        </nav>

        {instagramUrl && (
          <nav aria-label="Redes" className="flex min-w-0 flex-col gap-3 text-sm">
            <h2 className={headingClass}>Seguinos</h2>
            <a href={instagramUrl} target="_blank" rel="noreferrer" className={`${linkClass} inline-flex items-center gap-1`}>
              Instagram <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </nav>
        )}
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-sand/20 px-4 py-6 text-[13px] text-stone-300 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>
          © <CurrentYear /> OL. Indumenti · Argentina
        </p>
        <p>Envíos a todo el país · Mercado Pago y transferencia</p>
      </div>
    </footer>
  );
}
