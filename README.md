# Wellbusiness — sitio corporativo

Sitio informativo (no ecommerce) de **Wellbusiness**, marca de radiocomunicación de
**Idrocomsolutions**. Astro 7 + TypeScript + Tailwind 4, desplegado como Worker de Cloudflare
en **https://idrocomsolutions.com** (y `www`).

**El sitio no tiene backend ni base de datos propios.** Todo su contenido (textos de cada página,
productos, servicios, sectores, cobertura, FAQ, marcas) sale de la **plataforma de la agencia**
(Worker `agencia-plataforma`) y los formularios de contacto y de evaluación de cobertura se envían
allí. El contenido se edita en el portal de la plataforma, que es de la agencia: este repo ya no
tiene portal.

## Estructura

```
apps/web/                 El sitio (único workspace).
  src/pages/              Las páginas, /api/formularios/[tipo] y 404.
  src/components/         UI reutilizable.
  src/data/               site.ts (navegación, datos de contacto, motivos) y types.ts.
  src/lib/plataforma/     SDK de la plataforma (copia, sin dependencias) + cliente + URLs de fotos.
  src/lib/content/        Capa de contenido: bloques y colecciones desde la plataforma.
  redirecciones-medios.json   Mapa de las 67 URLs viejas /medios/<clave> → foto en la plataforma.
  wrangler.toml           Worker, dominios y service binding PLATAFORMA.
scripts/capturas-visuales.ts   Compara dos versiones del sitio con Playwright (móvil y escritorio).
docs/ESTADO.md            Estado actual, decisiones, cómo retomar y cómo volver atrás.
REPORTE-CORTE-WELLBUSINESS.md  Reporte del corte a la plataforma.
```

## Cómo lee el sitio la plataforma

- Cliente: `apps/web/src/lib/plataforma/cliente.ts`. En producción usa el **service binding**
  `PLATAFORMA` (Worker→Worker; por workers.dev daría el error 1042). En local (`astro dev`) usa
  `fetch` normal a la URL pública. Base: `/c/wellbusiness/v1`.
- Llave: secreto `PLATAFORMA_LLAVE`, una sola llave con los alcances `contenido:leer` y
  `formularios:enviar`. Nunca va al repo.
- Contenido: `src/lib/content/` trae los 98 bloques y cada colección una vez por versión del
  contenido (`/v1/version`), valida cada elemento con Zod (uno inválido se omite y se avisa) y
  cachea en memoria. Las páginas llevan `Cache-Control` de 5 minutos.
- Fotos: la plataforma las sirve desde su propio host. Ver "Fotos" en `docs/ESTADO.md`.
- Formularios: `src/pages/api/formularios/[tipo].ts` valida `Origin` y el señuelo, y reenvía con
  `enviarFormulario` (siempre con la IP del visitante y la página). Los errores 422 se muestran
  junto a cada campo; el 429 tiene un mensaje claro.

## Comandos

```sh
npm install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # y poner la llave real
npm run dev:web        # http://localhost:4321
npm run check:web      # astro check
npm run build:web      # genera apps/web/dist
npm run deploy:web     # despliega a producción (requiere build antes)
npm run version:web    # sube una versión sin desplegarla (URL de vista previa)
```

## Despliegue y vuelta atrás

```sh
npm run build:web
npm run deploy:web
```

Para volver a una versión anterior: `cd apps/web && npx wrangler deployments list`, y
`npx wrangler rollback <version-id> --yes`. La versión previa al corte a la plataforma (con D1 y
KV propios) es `a2e9fa25-0e27-4910-8a59-a53fbf609e7a`, pero **ya no funciona** si se borran esos
recursos (ver `REPORTE-CORTE-WELLBUSINESS.md`).

La llave en producción: `cd apps/web && npx wrangler versions secret put PLATAFORMA_LLAVE`.

## Datos del sitio que siguen en código

`src/data/site.ts`: navegación, motivos de contacto y `CONTACT_INFO` (WhatsApp, teléfono, correo,
dirección, horario, Facebook — todos confirmados). `whatsappLink(mensaje?)` arma el enlace `wa.me`;
no escribas el número a mano en un componente.

Pendientes de validación con el cliente (marcados en el código y visibles en pantalla como
pendientes, nunca como hechos): denominación de Dealer Autorizado Motorola
(`MOTOROLA_DEALER_LABEL` / `MOTOROLA_DEALER_LABEL_CONFIRMED`), relación legal
Wellbusiness–Idrocomsolutions, misión y valores, y la verificación técnica de las zonas de
cobertura.

## Marca, fuentes y accesibilidad

- Logos reales en `apps/web/public/images/brand/`, sin alterar ni recolorear. `Logo.astro` y
  `MotorolaBadge.astro` deciden qué versión usar según el fondo; no hardcodees rutas de marca.
- Fuentes autohospedadas (`@fontsource-variable/inter` y `manrope`), íconos SVG en línea.
- Menú móvil accesible, skip-link, foco visible. Las animaciones de aparición son mejora
  progresiva y respetan `prefers-reduced-motion`.
- Los CTA de catálogo, servicios y cobertura enlazan a `/contacto` con `?motivo=...&producto=...`.
