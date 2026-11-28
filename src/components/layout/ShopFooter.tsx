import type { JSX, SVGProps } from "react";
import Link from "next/link";
import { Lock, MapPin } from "lucide-react";
import { CurrentYear } from "@/components/layout/CurrentYear";
import { PaymentBadges } from "@/components/layout/PaymentBadges";
import type { NavLink } from "@/components/layout/ShopHeader";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/layout/SocialIcons";
import type { SiteTexts } from "@/modules/content/texts";

interface ShopFooterProps {
  collectionName: string;
  seasonLabel: string;
  /** Textos editables desde /admin/textos. */
  texts: SiteTexts;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
}

/** Formulario de reclamos de Defensa del Consumidor (Argentina). */
const CONSUMER_DEFENSE_URL = "https://autogestion.produccion.gob.ar/consumidores";

const linkClass = "inline-block py-1 text-cream transition-colors duration-150 hover:text-paper";
const headingClass = "eyebrow text-paper";
const legalLinkClass = "inline-block py-2 underline underline-offset-4 transition-colors hover:text-paper";

const HELP_LINKS: NavLink[] = [
  { href: "/contacto", label: "Contacto" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/cambios-y-devoluciones", label: "Cambios y devoluciones" },
];

interface Social {
  label: string;
  href: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

export function ShopFooter({
  collectionName,
  seasonLabel,
  texts,
  instagramUrl,
  tiktokUrl,
  facebookUrl,
}: ShopFooterProps) {
  const socials: Social[] = [
    instagramUrl ? { label: "Instagram", href: instagramUrl, Icon: InstagramIcon } : null,
    tiktokUrl ? { label: "TikTok", href: tiktokUrl, Icon: TikTokIcon } : null,
    facebookUrl ? { label: "Facebook", href: facebookUrl, Icon: FacebookIcon } : null,
  ].filter((social): social is Social => social !== null);

  const address = texts["footer.address"];

  return (
    <footer className="bg-espresso text-cream">
      <div className="grid gap-x-6 gap-y-12 px-4 pt-16 pb-12 sm:px-10 md:grid-cols-[minmax(0,1.8fr)_repeat(2,minmax(0,1fr))] lg:pt-20">
        <div className="flex flex-col gap-4">
          <Link href="/" className="display text-5xl font-bold tracking-normal text-cream">
            OL.
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-stone-300">{texts["footer.about"]}</p>
          <p className="eyebrow text-stone-400">{[collectionName, seasonLabel].filter(Boolean).join(" · ")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {texts["footer.paymentsTitle"] && <h2 className={headingClass}>{texts["footer.paymentsTitle"]}</h2>}
            <PaymentBadges />
          </div>
        </div>

        <nav aria-label="Ayuda" className="flex min-w-0 flex-col gap-1.5 text-sm">
          <h2 className={`${headingClass} mb-2`}>{texts["footer.helpTitle"]}</h2>
          {HELP_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-10 text-sm">
          {socials.length > 0 && (
            <nav aria-label="Redes sociales" className="flex flex-col gap-3.5">
              <h2 className={headingClass}>{texts["footer.socialTitle"]}</h2>
              <ul className="flex flex-wrap gap-2.5">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-cream/30 text-cream transition-colors duration-150 hover:border-paper hover:text-paper"
                    >
                      <Icon className="size-5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {address && (
            <div className="flex flex-col gap-3">
              {texts["footer.addressTitle"] && <h2 className={headingClass}>{texts["footer.addressTitle"]}</h2>}
              <address className="flex items-start gap-2 text-cream not-italic">
                <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span>{address}</span>
              </address>
            </div>
          )}
        </div>
      </div>

      {/* Barra inferior: seguridad · derechos (al medio) · legales */}
      <div className="flex flex-col items-center gap-4 border-t border-cream/20 px-4 py-6 text-center text-[13px] text-stone-300 sm:px-10 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:text-left">
        <p className="inline-flex items-center gap-2">
          {texts["footer.secure"] && (
            <>
              <Lock className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
              {texts["footer.secure"]}
            </>
          )}
        </p>

        <p className="xl:text-center">
          © <CurrentYear /> OL. Indumenti · Argentina
        </p>

        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2.5 xl:justify-self-end">
          <a href={CONSUMER_DEFENSE_URL} target="_blank" rel="noreferrer" className={legalLinkClass}>
            Defensa de las y los consumidores
          </a>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <Link href="/arrepentimiento" className={legalLinkClass}>
            Botón de arrepentimiento
          </Link>
        </div>
      </div>
    </footer>
  );
}
