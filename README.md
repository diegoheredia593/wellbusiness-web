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

1. **Logo real — YA INTEGRADO.** `src/components/Logo.astro` usa los archivos reales
   en `public/images/brand/` (`wellbusiness-logo.png` lockup completo,
   `wellbusiness-isologo.png` solo el ícono). No se alteró ni recoloreó el logo —
   ver el comentario del propio archivo para la lógica de qué versión se usa
   sobre fondo claro/oscuro.
2. **Denominación de Dealer Autorizado Motorola.** `src/data/site.ts` →
   `MOTOROLA_DEALER_LABEL` / `MOTOROLA_DEALER_LABEL_CONFIRMED`. Hoy se muestra el
   texto tal cual viene en el brief aprobado, junto al logo real de Motorola
   (`MotorolaBadge.astro`), con una nota visible de "pendiente de confirmación"
   en `/nosotros`. Pon `MOTOROLA_DEALER_LABEL_CONFIRMED = true` una vez
   Wellbusiness confirme la denominación vigente (eso oculta la nota).
3. **Relación legal Wellbusiness–Idrocomsolutions** y **Misión/valores** — sección
   `/nosotros`, marcadas explícitamente como pendientes de aprobación. No se
   publicó ningún texto de misión/visión no aprobado.
4. **Horario de atención** — único dato de contacto aún pendiente
   (`src/data/site.ts` → `CONTACT_INFO.hours`). WhatsApp, teléfono, correo,
   dirección y Facebook ya son reales y están enlazados (botón de WhatsApp
   flotante en todo el sitio + en `/contacto`, `tel:`/`mailto:`/Google Maps en
   `/contacto`).
5. **Catálogo de productos Motorola — 8 fichas reales.** `src/data/products.ts`
   tiene 8 radios reales (RVA50, DEM300, DEM500, MOTOTRBO R5, SL500e, TLK110 Wave
   PTX, MOTOTRBO R2, MagOne X10d), con specs transcritas de
   `Radios y descripciones.md`. DEM500 y SL500e no tienen foto real todavía
   (`images: []`) y muestran el estado "Ficha en preparación" — agrega sus fotos
   a `public/images/products/` y lístalas ahí cuando existan. Repetidoras y
   Accesorios originales siguen vacíos por la misma razón (sin datos reales
   todavía).
6. **Zonas de cobertura** (`src/data/coverage.ts`) — transcritas del material
   anterior, con nota visible en `/cobertura` de que están pendientes de
   verificación técnica. No se publicó ningún porcentaje de cobertura/eficacia.
7. **Fotografías de producto — YA INTEGRADAS**, con una nota de procedencia: dos
   de las fuentes que enviaste (para el MagOne X10d, el MOTOTRBO R5 y el TLK110
   Wave PTX) traían la marca de agua de otro distribuidor ("Mendotel") impresa en
   la foto. Se recortó esa franja (nunca se tocó la foto del producto en sí) —
   ver `public/images/products/` y decidiste conservarlas así. Las imágenes de
   RVA50, DEM300 y R2 ya venían limpias. Todo lo que siga sin foto real (DEM500,
   SL500e, Repetidoras, Accesorios) usa el placeholder abstracto de marca
   (`src/components/ImagePlaceholder.astro`) en vez de una imagen inventada.

## Cómo agregar un producto real al catálogo

Edita `src/data/products.ts` y agrega un objeto al array `PRODUCTS` siguiendo el
`interface Product` de `src/data/types.ts`:

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
  images: ["/images/products/xpr-3500e-1.jpg", "/images/products/xpr-3500e-2.jpg"],
  isPlaceholder: false,
}
```

En cuanto una categoría tenga al menos un producto real, su estado vacío
desaparece automáticamente y se muestran las fichas.

## Fotos de producto (zoom + galería)

Las fotos reales viven en `public/images/products/`. `ProductCard.astro`:

- Usa `images[0]` como foto principal, con **zoom al pasar el cursor** sobre la
  tarjeta (`object-contain` + `scale-110` en hover, sin librería).
- Si `images` tiene más de una foto, muestra puntos debajo de la imagen — al
  pasar el cursor o tocar un punto, cambia la foto principal (sin lightbox, sin
  dependencia nueva).
- Si `images` está vacío, cae automáticamente al placeholder de marca — nunca
  a una imagen rota ni inventada.

Para una foto nueva: colócala en `public/images/products/<slug>-N.jpg` (fondo
blanco, como las actuales) y agrégala al array `images` de ese producto.

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

## Contacto y redes (reales, ya integrados)

`src/data/site.ts` → `CONTACT_INFO`: WhatsApp/Teléfono `+593 98 161 5096`,
correo `ventasidrocom@hotmail.com`, dirección "Calle Rumichaca 212 y Manuel
Galecio", Facebook `facebook.com/wellbusiness.gye`. `whatsappLink(mensaje?)`
genera el `https://wa.me/...` correcto a partir de ese número — nunca lo
escribas a mano en un componente nuevo, importa esa función.

- **Botón de WhatsApp flotante** en todo el sitio (`WhatsAppFloatingButton.astro`,
  esquina inferior derecha) — se oculta solo si `CONTACT_INFO.whatsapp` volviera
  a `null`.
- `/contacto` tiene además un botón grande de WhatsApp y enlaces reales
  `tel:`/`mailto:`/Google Maps/Facebook en el panel "Contacto directo".
- El footer repite WhatsApp/Facebook como íconos y el resto de datos como texto
  enlazado.

## Marca — Wellbusiness y Motorola (logos reales)

`public/images/brand/` tiene los 4 archivos reales que enviaste, usados **sin
alterar ni recolorear**:

- `wellbusiness-logo.png` (lockup completo) — solo sobre fondo claro, su texto
  es oscuro y se perdería sobre el navy oscuro de marca.
- `wellbusiness-isologo.png` (solo el ícono) — usado sobre fondo oscuro
  (footer, hero) junto a un texto "Wellbusiness" propio en blanco, ya que no
  hay una versión clara del lockup completo.
- `motorola-isotipo.svg` / `motorola-logo.svg` — ambos con relleno oscuro fijo,
  por eso `MotorolaBadge.astro` los usa en su variante `chip` (un pill blanco)
  cuando el fondo detrás es oscuro, y en su variante `full` directo cuando el
  fondo ya es claro (tarjeta de `/nosotros`).

`Logo.astro` y `MotorolaBadge.astro` son los únicos componentes que deciden
cuál versión usar — nunca hardcodees una ruta de imagen de marca en una página.

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
