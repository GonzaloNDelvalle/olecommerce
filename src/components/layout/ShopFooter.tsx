import type { JSX, SVGProps } from "react";
import Link from "next/link";
import { CurrentYear } from "@/components/layout/CurrentYear";
import type { NavLink } from "@/components/layout/ShopHeader";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/layout/SocialIcons";

interface ShopFooterProps {
  collectionName: string;
  seasonLabel: string;
  about: string;
  helpTitle: string;
  socialTitle: string;
  bottomLine: string;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  whatsappNumber: string | null;
  supportEmail: string;
}

const linkClass = "inline-block py-1 text-cream transition-colors duration-150 hover:text-paper";
const headingClass = "eyebrow text-paper";

const HELP_LINKS: NavLink[] = [
  { href: "/contacto", label: "Contacto" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/cambios-y-devoluciones", label: "Cambios y devoluciones" },
  { href: "/arrepentimiento", label: "Botón de arrepentimiento" },
  { href: "/mi-cuenta", label: "Mis pedidos" },
];

interface Social {
  label: string;
  href: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

export function ShopFooter({
  collectionName,
  seasonLabel,
  about,
  helpTitle,
  socialTitle,
  bottomLine,
  instagramUrl,
  tiktokUrl,
  facebookUrl,
  whatsappNumber,
  supportEmail,
}: ShopFooterProps) {
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` : null;

  const socials: Social[] = [
    instagramUrl ? { label: "Instagram", href: instagramUrl, Icon: InstagramIcon } : null,
    whatsappHref ? { label: "WhatsApp", href: whatsappHref, Icon: WhatsAppIcon } : null,
    tiktokUrl ? { label: "TikTok", href: tiktokUrl, Icon: TikTokIcon } : null,
    facebookUrl ? { label: "Facebook", href: facebookUrl, Icon: FacebookIcon } : null,
  ].filter((social): social is Social => social !== null);

  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto grid max-w-none grid-cols-2 gap-x-6 gap-y-12 px-4 pt-16 pb-12 sm:px-10 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:pt-20">
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <Link href="/" className="display text-5xl font-semibold tracking-normal text-cream">
            OL.
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-stone-300">
            {about}
          </p>
          <p className="eyebrow text-stone-400">{[collectionName, seasonLabel].filter(Boolean).join(" · ")}</p>
          <a
            href={`mailto:${supportEmail}`}
            className="mt-1 text-sm text-cream underline-offset-4 transition-colors hover:text-paper hover:underline [overflow-wrap:anywhere]"
          >
            {supportEmail}
          </a>
        </div>

        <nav aria-label="Ayuda" className="flex min-w-0 flex-col gap-1.5 text-sm">
          <h2 className={`${headingClass} mb-2`}>{helpTitle}</h2>
          {HELP_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        {socials.length > 0 && (
          <nav aria-label="Redes sociales" className="col-span-2 flex min-w-0 flex-col gap-1.5 text-sm lg:col-span-1">
            <h2 className={`${headingClass} mb-2`}>{socialTitle}</h2>
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
      </div>

      <div className="mx-auto flex max-w-none flex-col gap-3 border-t border-cream/20 px-4 py-6 text-[13px] text-stone-300 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>
          © <CurrentYear /> OL. Indumenti · Argentina
        </p>
        <p>{bottomLine}</p>
      </div>
    </footer>
  );
}
