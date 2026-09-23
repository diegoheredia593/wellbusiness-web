import type { Product, ProductCategory } from "./types";

/**
 * Motorola catalog data.
 *
 * INTENTIONALLY EMPTY. COPY-WELLBUSINESS.md explicitly withholds real model
 * names/specs pending validation, and the build brief forbids inventing
 * models or specifications — including as "sample" placeholder data. Rather
 * than fabricate example radios, `/catalogo` renders an elegant "en
 * preparación" empty state per category (see `ProductCategorySection.astro`)
 * until real entries are added here.
 *
 * To publish a real product once Wellbusiness approves its fact sheet, add
 * an object shaped like this to the `PRODUCTS` array below:
 *
 * {
 *   slug: "xpr-3500e",                 // used for the /catalogo#slug anchor
 *   category: "Radios portátiles",     // must match one of the 4 categories
 *   name: "Motorola XPR 3500e",
 *   summary: "Resumen breve basado en la ficha oficial del producto.",
 *   type: "Portátil",
 *   band: "VHF / UHF",                 // official spec sheet value
 *   specs: [
 *     "Especificación verificada 1",
 *     "Especificación verificada 2",
 *     "Especificación verificada 3",
 *   ],
 *   applications: ["Uso compatible 1", "Uso compatible 2"],
 *   isPlaceholder: false,
 * }
 */
export const PRODUCTS: Product[] = [];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Radios portátiles",
  "Radios móviles y estaciones base",
  "Repetidoras",
  "Accesorios originales",
];
