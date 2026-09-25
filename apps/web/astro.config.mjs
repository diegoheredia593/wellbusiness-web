// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

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
  // El sitio público no usa sesiones — sin esto, el adaptador activa solo
  // un binding KV "SESSION" que nunca declaramos en wrangler.toml.
  session: false,
  // Igual que apps/portal: la barra de herramientas de desarrollo de Astro
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
