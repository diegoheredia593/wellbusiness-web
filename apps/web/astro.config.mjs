// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

import mediosViejos from './redirecciones-medios.json' with { type: 'json' };

// Sprint 4e: las fotos ya no se sirven desde este sitio (antes, `/medios/<clave>` leía un KV).
// Las URLs viejas pueden estar compartidas por WhatsApp o indexadas, así que cada una redirige
// (302, temporal) a su URL nueva en la plataforma. Es 302 y no 301 porque el destino es el
// workers.dev de la plataforma, que es temporal: un 301 lo guardarían los navegadores y los
// buscadores y habría que deshacerlo cuando la plataforma tenga dominio propio. Pasar a 301 en
// ese momento (ver REPORTE-CORTE-WELLBUSINESS.md). El mapa (67 fotos) sale del paquete de
// migración cruzado con lo que devuelve la plataforma; ver docs/ESTADO.md. Una clave que no esté
// aquí da 404.
const redirects = Object.fromEntries(
  Object.entries(mediosViejos).map(([vieja, nueva]) => [vieja, { status: /** @type {302} */ (302), destination: nueva }]),
);

// https://astro.build/config
export default defineConfig({
  // TODO: set the real production domain once it is confirmed, then re-enable
  // `site` (needed for canonical URLs / a future sitemap).
  // site: 'https://www.example.com',
  // Hybrid rendering (Fase 4): stays 'static' (the default) — most pages
  // read content from D1 so they opt out individually via
  // `export const prerender = false`. `404.astro` is ALSO `prerender = false`
  // (Astro forbids rewriting to a prerendered route from an on-demand one —
  // confirmed live) even though its own content stays 100% hardcoded and
  // never touches D1.
  adapter: cloudflare({ imageService: 'passthrough' }),
  redirects,
  // El sitio público no usa sesiones — sin esto, el adaptador activa solo
  // un binding KV "SESSION" que nunca declaramos en wrangler.toml.
  session: false,
  // La barra de herramientas de desarrollo de Astro
  // es un overlay solo de `astro dev` (nunca aparece en producción), pero
  // sí aparece en cualquier captura/verificación visual local si no se
  // desactiva — encontrado al comparar capturas Playwright local vs
  // producción antes de la Fase 5.
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  prefetch: {
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
