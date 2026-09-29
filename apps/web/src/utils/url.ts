import type { ContactMotive } from "../data/types";

/**
 * Builds a `/contacto` URL that pre-fills the contact form's "motivo" (and
 * optionally "producto") field via query params, read client-side by
 * `ContactForm.astro`'s inline script. Keeping this in one helper means every
 * CTA across the catalog/services/coverage pages links consistently.
 *
 * `service` (a `servicios` collection slug) is a separate, server-side-only
 * param: `contacto.astro` reads it to swap the hero copy for that service's
 * own título/gancho/descripción — a "hidden tab" with no visible nav entry,
 * only reachable via a `ServiceCard` link. It never touches the form itself.
 */
export function contactHref(options: { motive?: ContactMotive; product?: string; service?: string } = {}): string {
  const params = new URLSearchParams();
  if (options.motive) params.set("motivo", options.motive);
  if (options.product) params.set("producto", options.product);
  if (options.service) params.set("servicio", options.service);
  const query = params.toString();
  return query ? `/contacto?${query}` : "/contacto";
}
