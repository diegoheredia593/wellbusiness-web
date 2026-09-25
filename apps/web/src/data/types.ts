/**
 * Shared content types for the Wellbusiness site.
 *
 * As of Fase 4 this is the shape the content layer (`src/lib/content/index.ts`)
 * maps D1 rows into — components/pages only ever see these English field
 * names, never the CMS's own Spanish field names (`nombre`, `resumen`, ...),
 * so components didn't need to change when the data source did.
 */
import type { Imagen } from '@cms/core/schema';

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
  /** Editable in the portal (`pendienteValidacion`) — true while the zone's figures haven't been technically confirmed yet. */
  pendingValidation: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface MarqueeLogo {
  src: string;
  alt: string;
}

/** Editable in the portal (colección `categorias`) — no longer a fixed set. */
export type ProductCategory = string;

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
   * Fotos reales de la biblioteca de medios del portal, primera = portada.
   * Vacío (no `undefined`) cuando no hay foto real todavía — los
   * componentes caen al `ImagePlaceholder`, nunca a un `<img>` roto.
   */
  fotos: Imagen[];
  /** Set to true only for verified, Wellbusiness-approved catalog entries. */
  isPlaceholder: boolean;
}

/** Tarjetas de "Acceso rápido a soluciones" (Inicio) — colección `accesosRapidos`. */
export interface QuickLink {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: IconName;
}

/** Tarjetas de "Nuestros valores" (Nosotros) — colección `valores`. */
export interface CompanyValue {
  title: string;
  description: string;
  icon: IconName;
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
