// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Cliente para el que se compila el portal. Se define con la variable de
 * compilación CLIENTE (en Workers Builds: Settings → Builds → Variables).
 * Todo lo específico del cliente vive en `clientes/<CLIENTE>/`, incluida la
 * configuración de Cloudflare (`wrangler.portal.jsonc`).
 */
const CLIENTE = process.env.CLIENTE ?? 'wellbusiness';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // Ruta relativa a apps/portal.
    configPath: `../../clientes/${CLIENTE}/wrangler.portal.jsonc`,
    imageService: 'passthrough',
  }),
  session: false,
  integrations: [react()],
  trailingSlash: 'never',
  security: { checkOrigin: true },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@cliente': `@clientes/${CLIENTE}`,
      },
    },
  },
});
