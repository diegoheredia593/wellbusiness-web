# Wellbusiness — sitio corporativo

Sitio informativo (no ecommerce) para **Wellbusiness**, marca de radiocomunicación de
**Idrocomsolutions**. Astro + TypeScript + Tailwind CSS v4, contenido estático,
sin backend propio todavía (ver "Formularios" abajo).

Todo el copy viene de `COPY-WELLBUSINESS.md` (en la raíz de este repo — cópialo aquí
desde el brief original si no está). No se inventó ningún dato comercial, modelo,
especificación, cifra de cobertura/eficacia ni certificación.

## Repositorio y despliegue

Código en GitHub: [diegoheredia593/wellbusiness-web](https://github.com/diegoheredia593/wellbusiness-web).
Desplegado como Worker de Cloudflare (assets estáticos, sin backend):
**https://wellbusiness-web.herediadiego963.workers.dev**

Para volver a desplegar tras un cambio:

```sh
npm run build
npx wrangler deploy
```

`wrangler.toml` sirve `./dist` directamente como Worker de Static Assets (no
hay script de servidor) y usa el `404.html` real que genera Astro para rutas
no encontradas.

## Comandos

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # genera ./dist (sitio estático)
npm run preview   # sirve ./dist localmente
```

## Portal CMS — orden exacto para cargar fotos + contenido inicial

> Nota: esta sección describe el monorepo con `apps/portal`
> (`clientes/wellbusiness/`) — el resto de este README todavía describe la
> estructura previa de un solo sitio estático; se actualiza completo en la
> Fase 6.

Las fotos de productos y marcas viven en la **biblioteca de medios del
portal** (tabla `medios` + KV) — nunca como archivos estáticos de
`apps/web`, porque el portal corre en otro dominio y una ruta relativa
como `/images/productos/...` no resuelve ahí. El contenido inicial
(`clientes/wellbusiness/src/colecciones.ts`) referencia cada foto por su
id real de la biblioteca; cargarlo antes de que esos ids existan en el
D1 real ahora falla con un mensaje claro en vez de crear fichas con fotos
rotas (`apps/portal/src/lib/servidor/carga.ts`) — pero aun así hay un
único orden correcto, para no tener que averiguarlo por error:

1. **Sube las fotos al portal ya desplegado** (nunca contra uno local si
   el objetivo es producción):
   ```sh
   npx tsx scripts/importar-fotos.ts --url https://<worker-del-portal>.workers.dev \
     --email <correo del admin> --password '<clave>'
   ```
   Sube cada foto real de `apps/web/public/images/{products,logos}` a la
   biblioteca (si ya existe una con el mismo nombre de archivo, la
   reutiliza — seguro de correr más de una vez) y regenera
   `clientes/wellbusiness/src/medios-generados.ts` con el id real de cada
   una.
2. **Revisa y comitea** ese archivo regenerado (`git diff` primero — si
   no cambió nada, no hace falta desplegar de nuevo):
   ```sh
   git add clientes/wellbusiness/src/medios-generados.ts
   git commit -m "chore: regenerar medios-generados.ts"
   git push
   ```
3. **Despliega el portal** (Workers Builds lo hace solo al pushear a su
   rama de producción, o `npm run deploy:portal` a mano) — hasta que esto
   pase, el portal en producción todavía no conoce los ids que se acaban
   de subir.
4. **Recién ahora**, carga el contenido inicial:
   ```sh
   npx tsx scripts/importar-fotos.ts --url https://<worker-del-portal>.workers.dev \
     --email <correo del admin> --password '<clave>' --cargar
   ```
   (`--cargar` sube cualquier foto pendiente y además llama a
   `POST /api/carga-inicial` — el mismo botón "Cargar" de
   `/carga-inicial`, sin salir de la terminal.) Si algún id todavía no
   existiera (por ejemplo, se saltó el paso 3), el portal lo rechaza con
   la lista exacta de qué falta, sin crear nada a medias.

Si más adelante se agrega una foto nueva (un producto nuevo, por
ejemplo), el mismo orden aplica — correr el script contra el portal real,
comitear `medios-generados.ts`, desplegar, y solo entonces usarla desde
el editor.

## Estructura

> **Fase 4:** todo el contenido de negocio (productos, servicios, sectores,
> zonas de cobertura, FAQ, marcas, accesos rápidos, valores, y los textos de
> hero/SEO/CTA de cada página) ya no vive en `src/data/*.ts` — se edita en el
> **portal** (`apps/portal`) y el sitio lo lee de D1 vía `src/lib/content/`.
> El resto de esta sección (y de este README, hasta que se actualice
> completo en la Fase 6) todavía describe la estructura previa a esa
> migración; no edites `src/data/products.ts` ni similares para cambiar
> contenido — ya no existen.

```
src/
  components/   Piezas de UI reutilizables (Header, Footer, cards, formularios, Icon, ...)
  data/         Solo lo que se quedó en código: site.ts (navegación/motivos de
                contacto, taxonomía fija) y types.ts (tipos que usa src/lib/content).
  lib/content/  Capa de acceso a contenido (Fase 4) — bloques + colecciones desde D1.
  layouts/      BaseLayout.astro (head, header, footer, transición de página, reveal-on-scroll)
  pages/        Las 7 páginas + 404 (todas dinámicas salvo 404, ver astro.config.mjs)
  styles/       global.css (tokens de marca, Tailwind, animaciones)
  utils/        url.ts (query params del formulario de contacto), whatsapp.ts
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
4. **Contacto — todos los datos ya confirmados.** WhatsApp, teléfono, correo,
   dirección, horario de atención (9:00 am – 6:00 pm) y Facebook son reales y
   están enlazados (botón de WhatsApp flotante en todo el sitio + en
   `/contacto`, `tel:`/`mailto:`/Google Maps en `/contacto`).
   `src/data/site.ts` → `CONTACT_INFO`.
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

## Catálogo: overview + ficha de detalle

`/catalogo` (`src/pages/catalogo/index.astro`) es un overview tipo e-commerce:
`ProductCoverCard.astro` muestra solo la portada (`images[0]`) y el nombre —
toda la tarjeta enlaza a `/catalogo/<slug>` (`src/pages/catalogo/[slug].astro`,
ruta estática generada con `getStaticPaths()` a partir de `PRODUCTS`).

En la ficha de detalle:

- **Izquierda** — `ProductGallery.astro`: foto grande, flechas para alternar
  entre fotos y **zoom al pasar el cursor** (solo escritorio/puntero fino,
  sin librería — sigue al cursor dentro de la misma imagen, como en un sitio
  de e-commerce). Si `images` está vacío, cae al placeholder de marca.
- **Derecha** — nombre, tipo/banda, resumen, especificaciones completas como
  lista de beneficios, aplicaciones sugeridas (si existen), y los dos CTA:
  **"Habla con un asesor"** (lleva a `/contacto` con el motivo y el producto
  precargados) y **WhatsApp** (abre `wa.me` con el mensaje
  `Quiero más información sobre "<nombre del producto>"`, usando
  `CONTACT_INFO.whatsapp`/`whatsappLink()`; el botón no se muestra si ese
  número no está configurado).
- Abajo, "Productos relacionados" (misma categoría) reutiliza
  `ProductCoverCard`.

No hay precios, carrito ni checkout en ninguna parte del catálogo.

Para una foto nueva: colócala en `public/images/products/<slug>-N.jpg` (fondo
blanco, como las actuales) y agrégala al array `images` de ese producto —
tanto el overview como la ficha de detalle la recogen automáticamente.

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

## Logo marquee — "Tecnología y marcas con las que trabajamos"

`src/components/LogoMarquee.astro` (usado en `/`, justo debajo del hero) es
una franja horizontal infinita con 15 logos reales de marcas/tecnología del
sector (Motorola WAVE PTX, Huawei, Grandstream, PCTEL, Sinclair, RF Elements,
Zetron, SmartPTT, etc.) — **no es una afirmación de partnership/certificación
por marca** (eso solo aplica a Motorola, ya manejado aparte en
`MOTOROLA_DEALER_LABEL`); es una franja de "con qué trabajamos", con texto
neutro a propósito.

- Adaptado de un componente de referencia en React/shadcn/`motion` al stack
  real de este proyecto (Astro + CSS/JS vanilla, sin librería de animación) —
  mismo resultado visual (marquee infinito, difuminado en los bordes,
  acelera al pasar el cursor) vía un `@keyframes` + un script pequeño.
- Los logos vienen de `images/testimonios sin fondo/` (originales, ya sin
  fondo), recortados a su propio bounding box (nunca recoloreados/alterados)
  en `public/images/logos/`. Dos ajustes al set original: `zetron.png`
  traía un segundo logo distinto ("DAMM") apilado debajo en el mismo
  archivo — se usó solo el bloque de Zetron, que es lo que nombra el
  archivo; y de las dos variantes de L-com suministradas se usó una sola
  (`l-com_global.png`) para no repetir la misma marca dos veces en la
  franja.
- Se muestran en escala de grises y a color al pasar el cursor sobre cada
  logo — los colores de marca de 15 empresas distintas conviviendo a todo
  color en una fila se veían visualmente ruidosos.
- `src/data/logos.ts` es donde se edita la lista (agregar/quitar logos) —
  igual que el resto del contenido del sitio, no se hardcodea en el
  componente ni en la página.

## Hero de inicio — render 3D con hover

`src/components/Hero3DRadio.astro` reemplaza la foto simple que tenía el hero
de `/` por el radio TLK110 Wave PTX flotando directo sobre el fondo azul
oscuro (sin tarjeta blanca), con un resplandor rojo detrás para dar contraste
("sombra roja") y una rotación 3D:

- **Imagen**: `public/images/hero/tlk110-hero-3d.png`, un recorte de uno de
  los renders hiperrealistas de referencia en `images/render 3D Hero/` (el
  radio ya está en el catálogo real — `tlk110-wave-ptx`). El fondo se quitó
  con un flood-fill desde los bordes (nunca un umbral de brillo plano), para
  que un brillo/reflejo claro sobre el propio radio no se confunda con fondo
  y quede "agujereado"; de paso excluye la franja donde estaba la marca de
  agua de terceros, igual que en las fotos del catálogo.
- **"3D rotativo"**: una animación continua y suave (`--animate-hero-float`,
  `global.css`) hace que el radio oscile en 3D todo el tiempo.
- **"con hover"**: el script del propio componente añade una inclinación
  extra que sigue al cursor, en una capa anidada distinta a la de la
  animación continua — así nunca "saltan" entre sí al mezclarse.
- Todo se desactiva con `prefers-reduced-motion` (la animación vía
  `motion-safe:`, el hover vía el mismo chequeo de `matchMedia` que ya usa
  `ProductGallery.astro`).

Para cambiar de producto en el hero: genera/recorta un PNG con fondo
transparente equivalente y actualiza la ruta `src` dentro de
`Hero3DRadio.astro` — el resto (glow, animación, hover) no depende del
producto específico.

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
