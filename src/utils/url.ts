import type { ContactMotive } from "../data/types";

/**
 * Builds a `/contacto` URL that pre-fills the contact form's "motivo" (and
 * optionally "producto") field via query params, read client-side by
 * `ContactForm.astro`'s inline script. Keeping this in one helper means every
 * CTA across the catalog/services/coverage pages links consistently.
 */
export function contactHref(options: { motive?: ContactMotive; product?: string } = {}): string {
  const params = new URLSearchParams();
  if (options.motive) params.set("motivo", options.motive);
  if (options.product) params.set("producto", options.product);
  const query = params.toString();
  return query ? `/contacto?${query}` : "/contacto";
}
