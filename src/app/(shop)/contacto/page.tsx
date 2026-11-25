import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { InfoPage } from "@/components/shop/InfoPage";
import { ContactForm } from "@/modules/contact/ContactForm";
import { getStoreSettings } from "@/modules/settings/store-settings";
import { getSiteTexts } from "@/modules/content/site-texts";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por consultas sobre pedidos, talles, cambios o cualquier duda. Te respondemos por email.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage() {
  const [settings, texts] = await Promise.all([getStoreSettings(), getSiteTexts()]);
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`
    : null;

  return (
    <InfoPage
      eyebrow={texts["contact.eyebrow"]}
      title={texts["contact.title"]}
      intro={texts["contact.intro"]}
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
        <ContactForm />

        <aside className="flex flex-col gap-6 text-[15px] text-stone-700">
          <div className="flex gap-3">
            <Mail className="mt-0.5 size-5 shrink-0 text-chocolate" strokeWidth={1.6} aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">Email</p>
              <a href={`mailto:${settings.supportEmail}`} className="underline-offset-4 hover:underline [overflow-wrap:anywhere]">
                {settings.supportEmail}
              </a>
            </div>
          </div>
          {whatsappHref && (
            <div className="flex gap-3">
              <MessageCircle className="mt-0.5 size-5 shrink-0 text-chocolate" strokeWidth={1.6} aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink">WhatsApp</p>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {settings.whatsappNumber}
                </a>
              </div>
            </div>
          )}
          {settings.showroomAddress && (
            <div className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-chocolate" strokeWidth={1.6} aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink">Showroom (retiros)</p>
                <p>{settings.showroomAddress}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-chocolate" strokeWidth={1.6} aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">{texts["contact.response.title"]}</p>
              <p>{texts["contact.response.text"]}</p>
            </div>
          </div>
        </aside>
      </div>
    </InfoPage>
  );
}
