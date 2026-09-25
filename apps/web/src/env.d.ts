/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

/**
 * `wrangler types` (ver `worker-configuration.d.ts`) se genera con
 * `--include-runtime=false` a propósito: el volcado completo de tipos de
 * workerd redeclara globales tipo DOM (p. ej. `HTMLSelectElement`) que
 * chocan con los `<script>` del cliente (que sí corren en un navegador
 * real, no en el runtime de Workers) — confirmado en vivo: con el volcado
 * completo, `astro check` marcaba errores falsos en `ContactForm.astro`.
 * Sin el runtime completo falta la declaración ambiental del módulo
 * `cloudflare:workers` en sí, así que se declara aquí a mano, mínima —
 * `Env` ya lo define el archivo generado.
 */
declare module 'cloudflare:workers' {
  export const env: Env;
}
