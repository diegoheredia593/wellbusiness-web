/**
 * Shared content types for the Wellbusiness site.
 *
 * All copy in this file's sibling data modules is transcribed from
 * `COPY-WELLBUSINESS.md` (the approved content brief). Nothing here should be
 * invented — new real content should be added by editing the arrays in
 * `services.ts`, `sectors.ts`, `coverageZones.ts`, `faq.ts`, `products.ts` and
 * `site.ts`, not by hardcoding strings into components/pages.
 */

export type ContactMotive =
  | "Catálogo Motorola"
  | "Alquiler"
  | "Mantenimiento o reparación"
  | "Cobertura"
  | "Infraestructura"
  | "Estudios de ingeniería"
  | "Otro";

export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceItem {
  slug: string;
  title: string;
  hook: string;
  description: string;
  ctaLabel: string;
  motive: ContactMotive;
  icon: IconName;
}

export interface SectorItem {
  slug: string;
  title: string;
  description: string;
  icon: IconName;
}

export interface CoverageZone {
  slug: string;
  title: string;
  description: string;
  interestNote?: string;
  /** true = described directly in the approved copy; still pending technical validation before publishing. */
  pendingValidation: true;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type ProductCategory =
  | "Radios portátiles"
  | "Radios móviles y estaciones base"
  | "Repetidoras"
  | "Accesorios originales";

export interface Product {
  slug: string;
  category: ProductCategory;
  name: string;
  summary: string;
  type: string;
  band: string;
  specs: string[];
  applications: string[];
  /**
   * Real photos, under `/images/products/`, first = primary card image.
   * Leave empty (not undefined) when no real photo exists yet — ProductCard
   * falls back to the elegant ImagePlaceholder, never a broken <img>.
   */
  images: string[];
  /** Set to true only for verified, Wellbusiness-approved catalog entries. */
  isPlaceholder: boolean;
}

/**
 * Icon names map 1:1 to the small inline SVG paths in `Icon.astro`. Keep this
 * union in sync with that component's switch statement.
 */
export type IconName =
  | "radio-handheld"
  | "radio-mobile"
  | "tower"
  | "accessory"
  | "shield"
  | "truck"
  | "factory"
  | "leaf"
  | "building"
  | "wrench"
  | "map"
  | "signal"
  | "warehouse"
  | "compass"
  | "chevron-right"
  | "menu"
  | "close"
  | "check"
  | "whatsapp"
  | "facebook"
  | "phone"
  | "mail"
  | "pin"
  | "zoom"
  | "clock";
