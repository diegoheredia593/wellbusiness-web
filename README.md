# Wellbusiness — sitio corporativo

Sitio informativo (no ecommerce) para **Wellbusiness**, marca de radiocomunicación de
**Idrocomsolutions**. Astro + TypeScript + Tailwind CSS v4, contenido estático,
sin backend propio todavía (ver "Formularios" abajo).

Todo el copy viene de `COPY-WELLBUSINESS.md` (en la raíz de este repo — cópialo aquí
desde el brief original si no está). No se inventó ningún dato comercial, modelo,
especificación, cifra de cobertura/eficacia ni certificación.

## Comandos

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # genera ./dist (sitio estático)
npm run preview   # sirve ./dist localmente
```

## Estructura

```
src/
  components/   Piezas de UI reutilizables (Header, Footer, cards, formularios, Icon, ...)
  data/         Contenido y configuración editable (services.ts, sectors.ts, coverage.ts,
                faq.ts, products.ts, site.ts, types.ts) — edita estos archivos para
                actualizar copy/datos, no los componentes ni las páginas.
  layouts/      BaseLayout.astro (head, header, footer, transición de página, reveal-on-scroll)
  pages/        Las 7 páginas + 404
  styles/       global.css (tokens de marca, Tailwind, animaciones)
  utils/        url.ts (helper para prellenar el formulario de contacto vía query params)
```

## ⚠️ Pendientes de validación (no publicar sin confirmar)

Todo lo siguiente está marcado en el código con comentarios `PENDING`/`TODO` o
mensajes visibles en pantalla — nada de esto se muestra como un hecho confirmado:

1. **Logo real.** `src/components/Logo.astro` usa un wordmark de texto temporal
   porque el logo real no se adjuntó a tiempo. Instrucciones de reemplazo dentro del
   propio archivo (poner el SVG/PNG real en `public/` y cambiar el markup).
2. **Denominación de Dealer Autorizado Motorola.** `src/data/site.ts` →
   `MOTOROLA_DEALER_LABEL` / `MOTOROLA_DEALER_LABEL_CONFIRMED`. Hoy se muestra el
   texto tal cual viene en el brief aprobado, con una nota visible de "pendiente
   de confirmación" en `/nosotros`. Pon `MOTOROLA_DEALER_LABEL_CONFIRMED = true`
   una vez Wellbusiness confirme la denominación vigente (eso oculta la nota).
3. **Relación legal Wellbusiness–Idrocomsolutions** y **Misión/valores** — sección
   `/nosotros`, marcadas explícitamente como pendientes de aprobación. No se
   publicó ningún texto de misión/visión no aprobado.
4. **Datos de contacto directo** (WhatsApp, teléfono, correo, dirección, horario) —
   `src/data/site.ts` → `CONTACT_INFO`. Todos en `null` a propósito. Un canal solo
   aparece en el header/footer/contacto cuando tiene un valor real. Rellena estos
   campos cuando Wellbusiness los confirme; no hace falta tocar ningún componente.
5. **Catálogo de productos Motorola.** `src/data/products.ts` está intencionalmente
   vacío — el brief prohíbe inventar modelos o especificaciones, incluso como
   "ejemplo". Cada categoría muestra un estado vacío elegante ("Ficha en
   preparación") en vez de datos falsos. Ver la siguiente sección para agregar
   productos reales.
6. **Zonas de cobertura** (`src/data/coverage.ts`) — transcritas del material
   anterior, con nota visible en `/cobertura` de que están pendientes de
   verificación técnica. No se publicó ningún porcentaje de cobertura/eficacia.
7. **Fotografías reales.** Todas las imágenes son un placeholder abstracto de marca
   (`src/components/ImagePlaceholder.astro`) — nunca una foto inventada. Cada uso
   lleva un comentario `note` diciendo qué foto real debería ir ahí.

## Cómo agregar un producto real al catálogo

Edita `src/data/products.ts` y agrega un objeto al array `PRODUCTS` siguiendo el
`interface Product` de `src/data/types.ts`. Ejemplo (comentado en el propio
archivo):

```ts
{
  slug: "xpr-3500e",
  category: "Radios portátiles",      // debe ser una de las 4 categorías
  name: "Motorola XPR 3500e",
  summary: "Resumen breve basado en la ficha oficial del producto.",
  type: "Portátil",
  band: "VHF / UHF",
  specs: ["Especificación verificada 1", "Especificación verificada 2"],
  applications: ["Uso compatible 1", "Uso compatible 2"],
  isPlaceholder: false,
}
```

En cuanto una categoría tenga al menos un producto real, su estado vacío
desaparece automáticamente y se muestran las fichas.

## Formularios (front-end únicamente por ahora)

`ContactForm.astro` (`/contacto`) y `EvaluationForm.astro` (`/cobertura`) validan
en el navegador y muestran una confirmación, pero **no envían nada a ningún
backend todavía** — es a propósito, según el brief ("visualmente funcional aunque
la integración de backend quede pendiente").

Para conectar un backend real, edita el bloque `TODO (pending backend)` dentro del
`<script>` de cada componente. Tres opciones listas para usar:

1. **Formspree** (más rápido, sin backend propio):
   ```ts
   await fetch("https://formspree.io/f/TU_ID", {
     method: "POST",
     headers: { Accept: "application/json" },
     body: new FormData(form),
   });
   ```
2. **Endpoint propio / función serverless** — cualquier API que reciba
   `new FormData(form)` o `Object.fromEntries(new FormData(form))` por `POST`.
3. **Servicio de reenvío por correo** (p. ej. un webhook que reenvíe el payload a
   una casilla de Wellbusiness).

Los CTA de catálogo, servicios y cobertura ya enlazan a `/contacto` con
`?motivo=...&producto=...` precargados (ver `src/utils/url.ts` y el script de
`ContactForm.astro`) — no hace falta tocar esa parte al conectar el backend.

## Fuentes e íconos

Fuentes variables autohospedadas (`@fontsource-variable/inter` para texto,
`@fontsource-variable/manrope` para títulos) — no hay llamadas a Google Fonts en
tiempo de ejecución. Los íconos son SVG en línea hechos a mano
(`src/components/Icon.astro`), sin librería externa.

## Accesibilidad y rendimiento

- Menú móvil accesible (foco, `Escape`, `aria-expanded`), skip-link, foco visible
  en toda la interfaz.
- Animaciones de aparición (`data-reveal`) son *progressive enhancement*: el
  contenido es visible por defecto en HTML/CSS; JavaScript solo lo "arma" para
  animarlo si `IntersectionObserver` está disponible y el usuario no pidió
  movimiento reducido (`prefers-reduced-motion`). Si JS falla o está bloqueado,
  nada queda oculto.
- Transiciones de página nativas de Astro (`astro:transitions`).
- Sin librerías de animación de terceros, sin scripts pesados.
