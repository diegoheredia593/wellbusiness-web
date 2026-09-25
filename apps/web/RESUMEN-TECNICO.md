# Resumen técnico — sitio Wellbusiness

Documento de referencia sobre cómo está construido el sitio: stack, estructura,
componentes, páginas/secciones y la lógica de cada parte. Complementa a
`README.md` (que cubre comandos y despliegue) — aquí el foco es la arquitectura.

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | [Astro 7](https://astro.build) (`output: "static"` — sitio 100% estático, sin servidor propio) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 (vía plugin de Vite `@tailwindcss/vite`, sin `tailwind.config.js` — los tokens viven en `src/styles/global.css` con `@theme`) |
| Tipografías | `@fontsource-variable/inter` (texto) y `@fontsource-variable/manrope` (títulos), auto-hospedadas — cero peticiones a Google Fonts en runtime |
| Hosting/despliegue | Cloudflare Workers, modalidad **Static Assets** (`wrangler.toml` → `[assets] directory = "./dist"`), con dominio propio `idrocomsolutions.com` conectado como *custom domain* (además de la URL `*.workers.dev`) |
| Sin backend | No hay API propia, base de datos ni CMS. Todo el contenido es TypeScript tipado en `src/data/*.ts` |

No hay framework de UI (React/Vue/etc.) ni librería de animación: toda la
interactividad es JavaScript vanilla en bloques `<script>` dentro de los
componentes `.astro`, activados con transiciones de página nativas de Astro
(`<ClientRouter />` en `BaseLayout.astro`, evento `astro:page-load`).

## 2. Estructura de carpetas

```
src/
  components/   → piezas de UI reutilizables (30 archivos .astro)
  data/         → todo el contenido del sitio, como arrays/objetos TS tipados
  layouts/      → BaseLayout.astro (el único layout del sitio)
  pages/        → una ruta por archivo (routing basado en archivos de Astro)
  styles/       → global.css (tokens de marca, animaciones, utilidades)
  utils/        → helpers pequeños (ej. construir URLs de contacto)
public/         → imágenes, favicon, assets servidos tal cual
```

## 3. Capa de contenido (`src/data/*.ts`)

Principio central del proyecto (documentado en `CLAUDE.md`/`README.md`): **el
copy nunca se hardcodea dentro de una página o componente** — se edita en su
archivo de datos correspondiente, tipado según `src/data/types.ts`. Esto
permite editar textos sin tocar la maquetación.

| Archivo | Contenido |
|---|---|
| `site.ts` | Datos centrales: nombre de marca, navegación (`NAV_ITEMS`), CTA del header, info de contacto (WhatsApp/teléfono/correo/dirección/horario/Facebook), motivos del formulario de contacto, denominación de dealer Motorola |
| `about.ts` | Misión, visión, valores y frase de trayectoria de la empresa (usados en `/nosotros` y `/cobertura`) |
| `coverage.ts` | Las 5 zonas de cobertura (con porcentajes/eficacia, marcadas `pendingValidation: true` porque son referenciales), nota de PoC y disclaimer legal |
| `products.ts` | Catálogo completo Motorola: radios, repetidoras, accesorios (slug, categoría, specs, aplicaciones, imágenes) |
| `services.ts` | Los servicios que ofrece Wellbusiness (venta, alquiler, mantenimiento, infraestructura, etc.) |
| `sectors.ts` | Sectores/industrias atendidos |
| `faq.ts` | Preguntas frecuentes de `/contacto` |
| `logos.ts` | Logos de marcas/tecnología para el `LogoMarquee` (home y `/nosotros`) |
| `types.ts` | Todas las interfaces TS compartidas (`Product`, `ServiceItem`, `SectorItem`, `CoverageZone`, `FaqItem`, `IconName`, etc.) |

## 4. Layout base y piezas globales

**`src/layouts/BaseLayout.astro`** envuelve cada página: `<head>` (meta tags,
Open Graph, Twitter card, favicon, `noindex` opcional), `<Header />`,
`<slot />` (contenido de la página), `<Footer />` y el botón flotante de
WhatsApp. También registra el script de **scroll-reveal**: cualquier elemento
con `data-reveal` es visible por defecto; solo si el script corre y un
`IntersectionObserver` lo detecta en viewport se le anima un fade-up (si falla
JS o el usuario tiene `prefers-reduced-motion`, el contenido simplemente queda
visible sin animar — nunca se oculta contenido real por un fallo de JS).

- **`Header.astro`** — nav sticky con fondo blur, resalta el link activo,
  menú hamburguesa a pantalla completa en móvil (abre/cierra con JS, bloquea
  scroll del body, cierra con `Escape` o al hacer click en un link).
- **`Footer.astro`** — logo, tagline, redes, navegación, datos de contacto,
  bloque legal (Motorola) y la firma final "Desarrollado por bebrand.dev".
- **`WhatsAppFloatingButton.astro`** — botón flotante inferior-derecha con un
  anillo de pulso animado; no se renderiza si no hay número de WhatsApp
  configurado en `site.ts`.
- **`Logo.astro`** — wordmark/isologo de Wellbusiness (variantes clara/oscura
  según fondo).

## 5. Sistema de diseño (`src/styles/global.css` + componentes UI)

Tokens de marca definidos una sola vez en `@theme` (Tailwind v4): colores
(`--color-brand-*`), tipografías, sombras y `@keyframes` para cada animación
del sitio (fade-up al hacer scroll, glow del hero, flotación del collage,
marquee de logos, pulso del botón de WhatsApp). Una regla global respeta
`prefers-reduced-motion` (colapsa duraciones/iteraciones a casi cero).

Componentes UI reutilizables (sin lógica de negocio, solo presentación):
`Button`, `Badge`, `Icon` (set de SVGs inline, sin librería de iconos externa),
`SectionHeading`, `PageHero` (hero genérico de páginas internas), `CtaBanner`,
`MotorolaBadge`, `PendingNote` (aviso visual para contenido aún no
confirmado), `QuickLinkCard`, `SectorCard`, `ServiceCard`, `CoverageZoneCard`,
`ProductCoverCard`/`ProductGallery`/`CategoryEmptyState` (catálogo).

## 6. Páginas y secciones

Cada archivo en `src/pages/` es una ruta (routing por archivos de Astro).

### `/` — Home (`index.astro`)
Hero con `HeroProductCollage` (lineup de 6 productos Motorola reales que se
sobreponen entre sí, sin rotación, con contraste de sombras/glow sobre fondo
oscuro — ver comentario propio del componente) + tarjeta del logo "Motorola
Authorized Dealer" → franja de logos de marcas (`LogoMarquee`) → 4 bullets de
"cómo trabajamos" → 4 tarjetas de acceso rápido a soluciones
(`QuickLinkCard`) → sectores destacados (`SectorCard`) → teaser de cobertura
(badges por zona) → `CtaBanner` final.

### `/nosotros` — Nosotros (`nosotros.astro`)
Hero + bloque "cómo trabajamos" → respaldo Motorola (`MotorolaBadge`) →
relación con Idrocomsolutions → tarjeta de Misión/Visión (con la frase de
trayectoria como kicker) → tarjeta de Valores (grid de 4, ícono + texto) →
franja "Marcas que han confiado en nosotros" (`LogoMarquee`) → `CtaBanner`.

### `/cobertura` — Cobertura (`cobertura.astro`)
Hero + kicker de trayectoria → aviso de que las zonas/porcentajes son
referenciales (provienen del material histórico de la empresa) → grid de
`CoverageZoneCard` (una por cada zona de `coverage.ts`, con badge
"Referencial") → nota de comunicación PoC → disclaimer legal → formulario de
evaluación de cobertura (`EvaluationForm`).

### `/servicios` — Servicios (`servicios.astro`)
Hero + grid de `ServiceCard` (uno por servicio de `services.ts`) → `CtaBanner`.

### `/sectores` — Sectores (`sectores.astro`)
Hero + grid de `SectorCard` → `CtaBanner`.

### `/catalogo` — Catálogo (`catalogo/index.astro`)
Hero con badge Motorola → filtros por categoría (tabs con JS: muestran/ocultan
secciones sin recargar la página, sin librería, vía `data-filter`/
`data-category`) → una sección por categoría con grid de `ProductCoverCard`
(o un estado vacío `CategoryEmptyState` si aún no hay productos en esa
categoría) → bloque de asesoría → `CtaBanner`.

### `/catalogo/[slug]` — Ficha de producto (`catalogo/[slug].astro`)
**Ruta dinámica**: `getStaticPaths()` genera una página estática por cada
producto de `PRODUCTS` (`products.ts`) en build time — no hay renderizado en
servidor. Breadcrumb → galería de imágenes (`ProductGallery`) → nombre,
categoría, tipo/banda, resumen, aviso de "catálogo informativo, sin precios
públicos" → botones "Habla con un asesor" (link a `/contacto` pre-rellenado)
y "Escribir por WhatsApp" (con mensaje pre-armado incluyendo el nombre del
producto) → specs/beneficios → aplicaciones sugeridas (badges) → productos
relacionados (misma categoría, hasta 4).

### `/contacto` — Contacto (`contacto.astro`)
Hero + formulario principal (`ContactForm`) + panel lateral con canales
directos (WhatsApp, teléfono, correo, dirección con link a Google Maps,
Facebook, horario) → FAQ (`Faq`, acordeones `<details>` nativos).

### `404.astro`
Página no encontrada, `noindex`, con botones para volver al inicio o pedir
asesoría. Cloudflare la sirve automáticamente vía `not_found_handling =
"404-page"` en `wrangler.toml`.

## 7. Lógica / interactividad client-side

Todo vive en bloques `<script>` sin librerías externas, re-inicializados en
cada navegación vía `document.addEventListener("astro:page-load", ...)`
(necesario porque Astro usa transiciones de página tipo SPA):

- **Scroll-reveal** (`BaseLayout.astro`) — fade-up progresivo al entrar en
  viewport, con `IntersectionObserver`.
- **Header** (`Header.astro`) — fondo con sombra al hacer scroll, menú móvil
  a pantalla completa.
- **LogoMarquee** (`LogoMarquee.astro`) — animación CSS infinita que acelera
  al pasar el mouse (ajusta `animationDuration` inline).
- **HeroProductCollage** (`HeroProductCollage.astro`) — posición/tamaño/z-index
  de cada producto vía variables CSS custom properties (para no chocar con
  las utilidades `hover:` de Tailwind); bob colectivo animado + lift al hover.
- **Filtros de catálogo** (`catalogo/index.astro`) — tabs que muestran/ocultan
  secciones por categoría.
- **Formularios** (`ContactForm.astro`, `EvaluationForm.astro`) — **solo
  front-end por ahora**: validan con la API nativa del navegador
  (`checkValidity`/`reportValidity`) y muestran un estado de éxito, pero no
  envían nada a ningún backend todavía. El punto exacto donde conectar un
  backend real (Formspree, función serverless, etc.) está marcado con un
  comentario `TODO (pending backend)` en ambos archivos.
- **`contactHref()`** (`utils/url.ts`) — helper que arma la URL
  `/contacto?motivo=...&producto=...`; los CTAs del catálogo/servicios la
  usan para pre-rellenar el formulario de contacto vía query params, leídos
  por el script de `ContactForm.astro`.

## 8. Convenciones de contenido

- Todo el copy proviene de `COPY-WELLBUSINESS.md` (brief original) o de
  material que la propia Wellbusiness ha confirmado directamente (como
  `Sobre nosotros.md`) — no se inventan datos comerciales, cifras de
  cobertura, especificaciones ni certificaciones.
- El componente `PendingNote` marca visualmente cualquier contenido que
  siga pendiente de confirmación por parte de la empresa (hoy solo se usa en
  `coverage.ts`, para las cifras de cobertura, que son referenciales).
- Los íconos son SVG inline en `Icon.astro` — para agregar uno nuevo hay que
  sumar el `case` ahí y extender el tipo `IconName` en `types.ts`.

## 9. Despliegue

Sitio estático (`astro build` → `dist/`) servido por un Cloudflare Worker en
modo *Static Assets* (sin código de servidor propio). Dominio productivo:
`idrocomsolutions.com` / `www.idrocomsolutions.com` (custom domains) +
`wellbusiness-web.herediadiego963.workers.dev` (URL de Workers, se mantiene
activa vía `workers_dev = true`).

```sh
npm run build && npx wrangler deploy
```
