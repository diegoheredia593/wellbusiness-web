// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: set the real production domain once it is confirmed, then re-enable
  // `site` (needed for canonical URLs / a future sitemap).
  // site: 'https://www.example.com',
  trailingSlash: 'never',
  prefetch: {
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
