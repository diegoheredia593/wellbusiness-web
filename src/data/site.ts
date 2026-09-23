import type { ContactMotive, NavItem } from "./types";

/**
 * Central, editable site configuration. Every field that is currently a
 * confirmed real value has a comment saying so; every field left `null` (or
 * flagged `PENDING`) is a real gap called out in `COPY-WELLBUSINESS.md`'s own
 * "Pendientes de validación" section and must not be filled with invented
 * data. Fill these in once Wellbusiness confirms them — nothing else in the
 * codebase needs to change.
 */

export const SITE = {
  brandName: "Wellbusiness",
  parentCompany: "Idrocomsolutions",
  legalTagline: "Soluciones de radiocomunicación para empresas en Ecuador.",
  defaultDescription:
    "Radios Motorola, alquiler, servicio técnico y soluciones de cobertura para empresas en Ecuador. Solicita asesoría para tu operación.",
} as const;

/**
 * PENDING: the exact, currently-valid denomination for Wellbusiness's
 * Motorola dealer status must be confirmed before this is published as-is.
 * The string below is transcribed verbatim from the approved copy brief.
 */
export const MOTOROLA_DEALER_LABEL = "Dealer Autorizado Motorola en Ecuador";
export const MOTOROLA_DEALER_LABEL_CONFIRMED = false;

export const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo Motorola", href: "/catalogo" },
  { label: "Cobertura", href: "/cobertura" },
  { label: "Servicios", href: "/servicios" },
  { label: "Sectores", href: "/sectores" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

export const HEADER_CTA = { label: "Solicitar asesoría", href: "/contacto" };

/**
 * Real contact channels, confirmed by Wellbusiness. A field stays `null`
 * only for what genuinely hasn't been provided yet (just `hours` today) —
 * per the project brief, no channel is ever invented. The footer/Contacto
 * page only render a channel when its value is non-null.
 */
export const CONTACT_INFO: {
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  facebook: string | null;
} = {
  whatsapp: "+593 98 161 5096",
  phone: "+593 98 161 5096",
  email: "ventasidrocom@hotmail.com",
  address: "Calle Rumichaca 212 y Manuel Galecio",
  hours: null, // PENDING: "[horario por confirmar]"
  facebook: "https://www.facebook.com/wellbusiness.gye/",
};

/** wa.me needs digits only (no "+", spaces, or leading 0). */
export function whatsappLink(message?: string): string {
  const digits = (CONTACT_INFO.whatsapp ?? "").replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export const CONTACT_MOTIVES: ContactMotive[] = [
  "Catálogo Motorola",
  "Alquiler",
  "Mantenimiento o reparación",
  "Cobertura",
  "Infraestructura",
  "Estudios de ingeniería",
  "Otro",
];

export const FOOTER_LINKS: NavItem[] = [
  { label: "Catálogo Motorola", href: "/catalogo" },
  { label: "Cobertura", href: "/cobertura" },
  { label: "Servicios", href: "/servicios" },
  { label: "Sectores", href: "/sectores" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];
