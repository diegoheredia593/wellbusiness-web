import type { ContactMotive, NavItem } from "./types";

/**
 * Taxonomía/estructura del sitio que se queda fija en código (Fase 4) — a
 * diferencia de `SITE`/`MOTOROLA_DEALER_LABEL`/`CONTACT_INFO` (ahora
 * bloques `global.marca.*`/`global.contacto.*` en el portal, ver
 * `src/lib/content/index.ts`), estas listas no son contenido de negocio
 * editable: son la navegación y los motivos de contacto del formulario.
 */

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
