// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Production domain (see wrangler.toml). The apex is the canonical host;
  // `www` also serves the site but points its canonical tags here.
  site: 'https://idrocomsolutions.com',
  trailingSlash: 'never',
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
