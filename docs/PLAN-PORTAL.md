# Plan: Integrar el Portal CMS de Fluvida en Wellbusiness

> Este archivo es el plan original (aprobado por Diego, ejecutado fase por
> fase) más el estado real de cada fase al día de hoy. Si estás retomando
> este trabajo, lee primero **`docs/ESTADO.md`** — es el resumen pensado
> para arrancar rápido. Este archivo es la referencia completa de *qué* se
> decidió y *por qué*, fase por fase.

## Estado actual (resumen)

| Fase | Estado | Commits clave |
|---|---|---|
| 1 — Monorepo | ✅ Completa y verificada | `ed991bd`, `246df0e` |
| 2 — Configuración del cliente | ✅ Completa y verificada (con los 4 ajustes de Diego) | `9568c99`, `79bdf28` |
| 3 — Contenido inicial y fotos | ✅ Completa y verificada (con las 3 exigencias de Diego) | `d49c58d`, `43ec052`, `8b538c2` |
| 4 — El sitio lee desde D1 | ✅ Completa y verificada (incluye la comparación Playwright prod vs. local pedida antes de la Fase 5) | `2310726`, `fdd1350` |
| 5 — Formularios | ✅ Completa y verificada (con el cambio de Diego: `Origin` propio en vez de CORS) | `a869a15`, `5fd0910` |
| 6a — Despliegue del portal | ✅ Completa y verificada | `751666d`, `81d1f48`, `acb38bf` |
| 6b — Sitio público y dominios | ✅ Completa y verificada (README todavía pendiente) | `f95452d` |

Detalle completo de cada fase (qué se hizo, qué se verificó, qué falta) en
`docs/ESTADO.md`. Lo que sigue abajo es el plan original.

## Contexto

Wellbusiness (`C:\Users\USER\Desktop\wellbusiness-web`, Astro 7 estático + Tailwind
4, sin backend, desplegado como Worker de Cloudflare) tiene todo su contenido
hardcodeado en `src/data/*.ts` y en varias páginas `.astro`. Diego quiere poder
editar catálogo, servicios, sectores, cobertura, FAQ, logos y textos sin tocar
código, reutilizando el portal CMS que ya construyó para Fluvida
(`C:\Users\USER\Desktop\fluvida-web`: Astro 7 SSR + React 19 + D1 + Drizzle +
Better Auth + Zod 4, documentado en su `GUIA-PORTAL-CMS.md`).

El resultado debe ser un monorepo dentro del repo de wellbusiness-web con el
sitio público (`apps/web`), una copia del portal (`apps/portal`), el núcleo
genérico (`packages/cms-core`) y la configuración propia del cliente
(`clientes/wellbusiness`) — sin que el sitio público cambie visualmente en
absoluto. Este plan cubre las 6 fases que pidió Diego, con correcciones al
borrador original donde la realidad del código difería de lo que asumía.

## Hallazgos clave de la exploración (ajustan el borrador original)

1. **`src/data/about.ts` ya existe** con `MISSION`, `VISION`,
   `COMPANY_VALUES`, `COMPANY_TRAJECTORY`, ya renderizados en `/nosotros`.
2. El resto de textos de hero/secciones/CTA/SEO de `index.astro` y
   `nosotros.astro` **sí seguían 100% hardcodeados en la página**.
3. `README.md` estaba desactualizado en varios puntos (catálogo real tiene
   **19 productos**, no 8; el hero real es `HeroProductCollage`, no
   `Hero3DRadio`) — corregido de paso en la Fase 3/4 (ver `README.md`).
4. **No existía ningún script para importar fotos en bulk a la librería de
   medios.** Se escribió `scripts/importar-fotos.ts` (Fase 3).
5. **`z.boolean()` no está soportado por el portal.** El patrón real usado
   es `z.enum(['si','no']).meta({ opciones: { si:'Sí', no:'No' } })`. Aplica
   a `pendienteValidacion` y `esPlaceholder`.
6. **Los formularios públicos NO estaban conectados a D1 en ningún lado**
   al momento de escribir este hallazgo — ni siquiera en Fluvida. Resuelto
   para Wellbusiness en la Fase 5 (ver esa sección); Fluvida sigue sin
   conectar los suyos.
7. `crearFuenteD1().coleccion()` **no filtra por `publicado`** — solo excluye
   lo eliminado. Cada función de dominio del sitio llama `soloPublicados()`
   explícitamente, y usa `safeParse` **por ítem** (nunca sobre el arreglo
   completo).
8. El KV gratuito (1 GB / 1.000 subidas por día) se comparte con
   `fluvida-portal` en la misma cuenta de Cloudflare
   (`84ffa5d2db10e557297317693d5ae3bf`). **Decisión final tras la revisión de
   Diego**: reparto 400 MB Wellbusiness / 500 MB Fluvida (900 MB de 1 GB,
   con margen) — ver `clientes/wellbusiness/src/index.ts` y el commit
   `chore/reparto-kv` en el repo de Fluvida.
9. Astro 7 soporta "hybrid rendering": el sitio se quedó en `output:
   'static'` (el default) y cada página que necesita leer D1 exporta
   `export const prerender = false`.
10. **Decisión confirmada**: las imágenes del `HeroProductCollage` se quedan
    como archivos estáticos en `public/images/hero/` — no entran a la
    librería de medios (posiciones/tamaños muy afinados, dependen del
    aspect ratio real de cada foto actual).
11. `MOTOROLA_DEALER_LABEL` y los campos de `SITE` se mapearon como bloques
    `global.marca.*`. `NAV_ITEMS` y `CONTACT_MOTIVES` se quedaron en código
    (son taxonomía/estructura, no copy).

## Fase 1 — Monorepo ✅ COMPLETA Y VERIFICADA

```
wellbusiness-web/
├── apps/web/                 ← git mv del sitio actual (conserva historial)
├── apps/portal/              ← copiado de fluvida-web/apps/portal (sin historial git, es una copia de archivos)
├── packages/cms-core/        ← copiado de fluvida-web/packages/cms-core
└── clientes/wellbusiness/    ← nuevo
```

- `git mv src public astro.config.mjs wrangler.toml package.json ... apps/web/` (todo lo que hoy es raíz del sitio), ajustando `apps/web/package.json` (nombre, scripts).
- Copiar `apps/portal` y `packages/cms-core` de `fluvida-web` tal cual (es una copia de archivos entre dos repos distintos en disco, no un submódulo — a partir de aquí evolucionan por separado).
- Root `package.json` nuevo: `workspaces: ["packages/*","clientes/*","apps/*"]`, scripts `build:web/deploy:web/version:web/build:portal/deploy:portal/version:portal/check:portal`.
- `apps/portal/astro.config.mjs`: `CLIENTE` por defecto `'wellbusiness'`.
- `apps/portal/package.json`: agregar `"@clientes/wellbusiness": "*"` a sus dependencias.
- Verificar `npm run build:web` produce un `dist/` con el mismo contenido HTML que antes del `git mv`.
- Crear `CAMBIOS-NUCLEO.md` en la raíz — cada cambio a `apps/portal`/`packages/cms-core` va documentado ahí, en commit separado.

**⏸ CHECKPOINT** — cumplido: árbol final + build idéntico confirmado. Commits `ed991bd`, `246df0e`.

## Fase 2 — Configuración del cliente (`clientes/wellbusiness/`) ✅ COMPLETA Y VERIFICADA

Archivos (mismo patrón exacto que `clientes/fluvida/`): `package.json`
(paquete `@clientes/wellbusiness`, exports `.`/`./bloques`/`./esquemas`/`./colecciones`,
depende de `@cms/core: "*"`), `src/index.ts` (`definirCliente({...})`),
`src/bloques.ts`, `src/esquemas.ts`, `src/colecciones.ts`, `assets/`, `wrangler.portal.jsonc`.

`src/index.ts`: `colorAcento` desde `--color-brand-steel` (`#2867a5`),
`zonaHoraria: 'America/Guayaquil'`, `requiereAprobacion: false`,
`diasPapelera: 30`, `editores.eliminar: false`.

**4 ajustes de Diego aplicados sobre el borrador original** (commit `79bdf28`):
1. `almacenamiento.limiteBytes` bajado a 400 MB (era 950 MB) — reparto real
   con Fluvida documentado en un comentario en `src/index.ts`.
2. `nombresIconos` recortado a los 15 íconos de contenido, quitando los de
   interfaz que ningún campo usa (confirmado por grep).
3. Menú lateral agrupado en "Catálogo" / "Páginas" / "Marcas" / "Contacto"
   vía el campo `grupo` de cada colección.
4. `cobertura.disclaimer.*` movido al nivel `sistema`.

### Mapeo de contenido (colecciones) — implementado tal cual

| Colección | Campos (control Zod) | Origen | Notas |
|---|---|---|---|
| **categorias** | `nombre`, `slug`, `descripcion` (opcional) | `ProductCategory` | grupo "Catálogo" |
| **productos** | `nombre`, `slug`, `categoria` (relación→categorias.slug), `resumen`, `tipo`, `banda`, `specs`, `aplicaciones`, `fotos` (galería), `esPlaceholder` (si/no) | `products.ts` (19 items) | grupo "Catálogo" |
| **servicios** | `titulo`, `slug`, `gancho`, `descripcion`, `textoBoton`, `motivo` (enum `ContactMotive`), `icono` | `services.ts` (6 items) | grupo "Páginas" |
| **sectores** | `titulo`, `slug`, `descripcion`, `icono` | `sectors.ts` (5 items) | grupo "Páginas" |
| **zonas** (cobertura) | `titulo`, `slug`, `descripcion`, `notaInteres`, `pendienteValidacion` (si/no) | `coverage.ts` (5 zonas) | grupo "Páginas" |
| **preguntas** (FAQ) | `pregunta`, `respuesta` (`textoLargo`, no `rico`) | `faq.ts` (6 items) | grupo "Contacto" |
| **marcas** (logos) | `nombre`, `logo` (imagen) | `logos.ts` (15 items) | grupo "Marcas" |
| **accesosRapidos** | `titulo`, `descripcion`, `enlace`, `textoBoton`, `icono` | 4 `QuickLinkCard` | grupo "Páginas" |
| **valores** | `titulo`, `descripcion`, `icono` | `COMPANY_VALUES` (4 items) | grupo "Páginas" |

### Bloques — implementados tal cual (con `cobertura.disclaimer.*` movido a `sistema` por el ajuste #4 de Diego)

- `global.marca.*`, `global.contacto.*` — de `SITE`/`MOTOROLA_DEALER_LABEL`/`CONTACT_INFO`.
- `nosotros.*`, `inicio.*`, `servicios.*`, `sectores.*`, `cobertura.*`, `catalogo.*`, `contacto.*` — SEO/hero/CTA de cada página. Incluye `inicio.trabajo.item1..4` (encontrados como un hueco real del plan original y agregados durante la Fase 4).
- Nivel `sistema`: strings de accesibilidad + `cobertura.disclaimer.*`.

**Se quedó en código, sin cambios**: `NAV_ITEMS`, `CONTACT_MOTIVES`, `HeroProductCollage` (posiciones, z-index y sus imágenes), el disclaimer legal de Motorola/marcas, `Icon.astro`, todos los estilos.

**⏸ CHECKPOINT** — cumplido: `CLIENTE=wellbusiness npm run build:portal` y `npm run check:portal` sin errores.

## Fase 3 — Contenido inicial y fotos ✅ COMPLETA Y VERIFICADA

- `clientes/wellbusiness/src/colecciones.ts`: transcripción literal de los 9
  arreglos — cero contenido inventado.
- **Pivote importante sobre el borrador original**: las fotos NO se dejaron
  como archivos estáticos con rutas `/images/...` (`src/fotos.ts`, creado y
  luego borrado). Diego verificó en vivo que esas rutas se ven rotas en el
  portal (dominio distinto) y pidió volver al plan original: todas las
  fotos de producto/marca viven en la biblioteca de medios del portal
  (tabla `medios` + KV), nunca en `public/`. Las fotos de diseño (hero, logo
  del sitio) sí se quedan en `public/`.
- **Script de importación de fotos** (`scripts/importar-fotos.ts`, en la
  raíz del repo, fuera de `apps/`): sube las 67 fotos reales (52 productos +
  15 marcas) al portal vía su propia API (`POST /api/medios`, la misma ruta
  que usa el recorte por navegador — reutiliza toda su validación), es
  idempotente (busca por nombre de archivo antes de subir, nunca duplica),
  y escribe `clientes/wellbusiness/src/medios-generados.ts` con los ids
  reales. Soporta `--cargar` para además llamar a "Cargar contenido
  inicial" en la misma corrida.
- **Seguro contra fotos rotas** (exigencia de Diego): `apps/portal/src/lib/servidor/carga.ts`
  ahora verifica, antes de escribir nada, que cada `medio` referenciado por
  el contenido inicial exista realmente en la tabla `medios` — si falta
  alguno, la carga completa se rechaza con un mensaje claro (nunca crea
  ítems con fotos rotas). Documentado en `CAMBIOS-NUCLEO.md` como cambio
  portable a Fluvida.
- **Orden exacto para producción** documentado en `README.md` y en la Fase 6
  de este plan (ver abajo): importar fotos → comitear
  `medios-generados.ts` → desplegar el portal → cargar contenido inicial.

**⏸ CHECKPOINT** — cumplido: 67/67 fotos subidas sin duplicados, "Cargar
contenido inicial" corre sin errores contra el contenido real. Commits
`d49c58d`, `43ec052`, `8b538c2`.

## Fase 4 — El sitio lee desde D1 ✅ COMPLETA Y VERIFICADA

- `@astrojs/cloudflare` agregado a `apps/web`. `wrangler.toml` gana los
  bindings `DB` (misma D1 que el portal) y `MEDIOS` (mismo KV);
  `apps/web/src/pages/medios/[...clave].ts` sirve `/medios/*` desde el
  sitio, leyendo el binding KV directamente (mismo patrón que el portal).
- `apps/web/src/lib/content/fuente.ts` + `apps/web/src/lib/content/index.ts`:
  una función por colección, cada una con `safeParse` **por ítem** +
  `soloPublicados()`.
- Todas las páginas/componentes migrados de `src/data/*.ts` a estas
  funciones. `Product.images: string[]` → `Product.fotos: Imagen[]`
  (mejora real: ahora hay `width`/`height` explícitos en el `<img>`).
- Páginas con contenido: `export const prerender = false` +
  `apps/web/src/middleware.ts` con `Cache-Control: public, max-age=300,
  stale-while-revalidate=3600`. `/catalogo/[slug]` es dinámica y da 404 real.
  `404.astro` **también** es `prerender = false` (no prerenderizada como
  decía el borrador original — Astro prohíbe un rewrite hacia una ruta
  prerenderizada desde una ruta dinámica, confirmado en vivo; su contenido
  sigue siendo 100% fijo en código).
- `src/data/*.ts` borrados salvo lo que se quedó en código (`site.ts`
  reducido a `NAV_ITEMS`/`CONTACT_MOTIVES`/`FOOTER_LINKS`/`HEADER_CTA`).
  67 fotos de producto/logo borradas de `public/images/` (verificado con
  grep que nada más las referencia).

**⏸ CHECKPOINT** — cumplido, en dos partes:
1. Verificación funcional en vivo (contenido real, 404 real, borrador/publicado) — hecha durante la Fase 4 misma.
2. **Verificación visual Playwright pedida por Diego antes de aprobar seguir a la Fase 5**: comparación página completa, 390px y 1440px, de las 8 páginas (`/`, `/nosotros`, `/cobertura`, `/servicios`, `/sectores`, `/catalogo`, `/catalogo/rva50`, `/contacto`) contra la producción real (`https://idrocomsolutions.com`). Resultado: **16/16 pares pixel-perfect** tras corregir dos artefactos del propio método de prueba (la barra de desarrollo de Astro, nunca visible en producción — corregido permanentemente con `devToolbar: { enabled: false }` en `apps/web/astro.config.mjs`; y que Playwright no dispara imágenes `loading="lazy"` en una captura de página completa sin hacer scroll real primero). También confirmado: `/no-existe` y `/catalogo/no-existe` dan 404 + `noindex`; `Cache-Control` correcto en las 8 páginas; consultas a D1 por página muy por debajo del límite de 50 (`/` = 5, `/catalogo/rva50` = 3 — detalle completo en `docs/ESTADO.md`). Commits `2310726`, `fdd1350`.

## Fase 5 — Formularios ✅ COMPLETA Y VERIFICADA

**Ajuste de Diego sobre el borrador original**: la ruta vive en el propio
sitio (el formulario llama al mismo dominio que lo sirve), así que **no
hay CORS** — en su lugar se rechaza toda petición cuyo `Origin` no sea el
del propio sitio. Implementado como "mismo origen que la propia petición"
(`request.headers.get('origin') === url.origin`) en vez de una lista fija
de dominios: cubre automáticamente tanto desarrollo local (cualquier puerto
de `astro dev`) como producción, porque Cloudflare enruta
`idrocomsolutions.com` **y** `www.idrocomsolutions.com` al mismo Worker
(ver `apps/web/wrangler.toml`) — `url.origin` siempre refleja el dominio
real que el visitante haya usado. Una petición sin `Origin` se rechaza
igual (un navegador real siempre lo manda en un POST).

- `apps/web/src/pages/api/formularios/[tipo].ts` (nuevo): valida el
  `Origin`, aplica el límite por IP, revisa el honeypot, valida con Zod
  según `cliente.formularios[tipo].esquema` y recién ahí inserta en D1
  (`INSERT INTO envios_formulario (id, tipo, datos) VALUES (?, ?, ?)` — el
  resto de columnas tiene default en la propia tabla).
- **Rate-limiter promovido a `packages/cms-core/src/limites.ts`** (era
  privado de `apps/portal/src/lib/servidor/limites.ts`) — ver
  `CAMBIOS-NUCLEO.md`. El portal sigue llamando `limitar()`/`ipDe()` igual
  que antes (el archivo del portal quedó como envoltorio de una línea con
  el prefijo `"portal:"`); el sitio la usa con el prefijo `"formularios:"`,
  clave por IP (`formularios:<ip>`), 5 envíos cada 15 minutos — el mismo
  mecanismo (misma tabla `rate_limit`, misma función) que ya usaba el
  portal para el login.
- **Validación Zod real, no solo por nombre de campo**: se agregó el campo
  `esquema` a `DefinicionFormulario` (`packages/cms-core/src/cliente.ts`,
  ver `CAMBIOS-NUCLEO.md`) — cada formulario declara su propio
  `z.object({...}).strict()` en `clientes/wellbusiness/src/esquemas.ts`
  (`formularioContactoSchema`, `formularioEvaluacionSchema`). `.strict()`
  es lo que rechaza un tipo desconocido o un campo de más con un 422 claro
  en vez de guardarlo a medias. `contacto.motivo` reutiliza el mismo enum
  `motivosContacto` que ya usaba el campo `motivo` de `servicios` — una
  sola fuente de verdad.
- **Honeypot**: campo `sitioWeb`, oculto fuera de pantalla (no
  `display:none`) en `ContactForm.astro`/`EvaluationForm.astro`. Si llega
  con contenido, la ruta responde `{ ok: true }` sin guardar nada — nunca
  se le avisa al bot que fue detectado.
- `contacto`/`evaluacion-cobertura` ya estaban declarados como
  `DefinicionFormulario` en `clientes/wellbusiness/src/index.ts` desde la
  Fase 2 (el plan original decía que faltaba; no era así al llegar a esta
  fase) — solo les faltaba el campo `esquema` nuevo.
- `?motivo=&producto=` en el flujo de `/contacto` se mantuvo sin cambios.
- El error de envío (red caída, 429, 500) muestra un aviso con un botón
  "Escribir por WhatsApp" (usa el mismo `contacto.whatsapp` del bloque
  `global.contacto.whatsapp` que ya usa la página) — el mensaje de éxito
  solo aparece si el `fetch` realmente devolvió `{ ok: true }`.
- Fuera de alcance de esta fase (anotado, no se construyó): verificación
  Turnstile — queda como mejora futura documentada.

**⏸ CHECKPOINT cumplido**: un envío real de "contacto" y uno de
"evaluacion-cobertura" hechos contra el sitio en local (`http://localhost:4322`)
aparecen en "Formularios recibidos" del portal. Además, verificado en vivo:
un envío con el honeypot lleno responde éxito pero no aparece en el portal;
un tipo de formulario desconocido da 404; un campo de más da 422; el sexto
envío en la ventana de 15 minutos desde la misma IP da 429; una petición sin
`Origin` o con un `Origin` ajeno da 403.

## Fase 6a — Despliegue del portal ✅ COMPLETA Y VERIFICADA

Diego aprobó explícitamente solo esta mitad (no tocar el worker
`wellbusiness-web` ni sus dominios). Pasos reales (algunos difieren del
borrador original de abajo — anotado en cada uno):

1. Verificado que `wrangler` ya tenía sesión iniciada en la cuenta
   `84ffa5d2db10e557297317693d5ae3bf` (`npx wrangler whoami`) — no hizo
   falta pedirle a Diego que inicie sesión.
2. D1 `wellbusiness-db` (`2afc8400-5ed4-423d-bf72-27f7cee8ece0`) y KV
   `wellbusiness-medios` (`76a57ddc1568418ebaeb3c2d6bd8e8d2`) creados con
   `npx wrangler d1 create` / `npx wrangler kv namespace create`
   directamente (**distinto del borrador original**, que decía "vía las
   herramientas MCP de Cloudflare" — Diego pidió simplemente crearlos, y
   wrangler ya estaba autenticado). Ids puestos en
   `clientes/wellbusiness/wrangler.portal.jsonc`, comit y push.
3. Secretos `BETTER_AUTH_SECRET` (generado al azar) y `SETUP_SECRET` (dado
   por Diego) subidos con `wrangler secret put --config
   clientes/wellbusiness/wrangler.portal.jsonc` — ninguno de los dos se
   guardó en ningún archivo.
4. Portal publicado con `CLIENTE=wellbusiness npm run build:portal &&
   npm run deploy:portal` (**distinto del borrador original**, que
   proponía Workers Builds conectado a GitHub vía la UI del dashboard —
   Diego pidió publicar directamente desde esta rama; conectar Workers
   Builds sigue pendiente, ver Fase 6b). URL (sin dominio propio todavía):
   `https://wellbusiness-portal.herediadiego963.workers.dev`.
5. Diego creó el primer administrador desde `/configuracion-inicial`.
6. **Fotos, en el orden exacto que exige el propio portal** (rechaza el
   paso siguiente si se salta este orden — ver "Portal CMS — orden
   exacto..." en `README.md`):
   1. `importar-fotos.ts` (sin `--cargar`) contra el portal real — sube las
      67 fotos y regenera `medios-generados.ts`.
   2. Revisado y comiteado ese archivo regenerado.
   3. Portal redesplegado (para que el código conozca los ids nuevos).
   4. Recién ahí, `importar-fotos.ts --cargar` — reutiliza las 67 fotos
      (no las duplica) y carga el contenido inicial: 68 elementos.
- Bug real encontrado y corregido de paso: `deploy:portal`/`version:portal`
  en el `package.json` raíz no encontraban la configuración de Cloudflare
  — ahora apuntan al `wrangler.json` que el adaptador de Astro genera
  resuelto en `apps/portal/dist/server/` en cada build.

**⏸ CHECKPOINT pendiente de que Diego lo confirme**: entrar al portal, ver
los 19 productos con sus fotos y editar uno. Verificado por Claude antes de
avisarle: `/colecciones/productos` lista los 19 (cada uno con foto de
portada) y `/colecciones/productos/prod-rva50` carga bien para editar.

## Fase 6b — Sitio público y dominios ✅ COMPLETA Y VERIFICADA

Diego pidió explícitamente el despliegue del sitio ("desplegalo en
cloudflare"). Antes de tocar nada, Claude preguntó y confirmó que
`apps/web/wrangler.toml` ya traía declarados `idrocomsolutions.com` y
`www.idrocomsolutions.com` como `custom_domain` — un `wrangler deploy` sin
más apunta esos dominios reales al worker nuevo en el mismo paso,
reemplazando lo que los servía hasta ahora (el sitio de antes de esta
migración). Diego confirmó que quería el corte completo, worker + dominios,
en el mismo paso.

- `apps/web/wrangler.toml`: mismos ids reales de D1/KV que ya tenía el
  portal (D1 `wellbusiness-db` = `2afc8400-5ed4-423d-bf72-27f7cee8ece0`, KV
  `wellbusiness-medios` = `76a57ddc1568418ebaeb3c2d6bd8e8d2`).
- `npm run build:web && npx wrangler deploy --config dist/server/wrangler.json`
  desde `apps/web` (mismo patrón de config resuelto que se corrigió para el
  portal en la 6a — el `deploy:web` del `package.json` raíz, sin
  `--config`, sigue sin el fix porque en este caso el `wrangler.toml` vive
  directo en `apps/web/`, no en `clientes/*`, así que si algún día falla
  igual que el del portal, el arreglo es el mismo).
- Desplegado a `idrocomsolutions.com`, `www.idrocomsolutions.com` y
  `https://wellbusiness-web.herediadiego963.workers.dev`.
- Verificado en vivo contra el dominio real: las 8 páginas de la
  comparación de la Fase 4 dan 200 con `Cache-Control` correcto,
  `/no-existe` da 404, una foto real de `/medios/fotos/...` carga como
  `image/jpeg`, y `/contacto` muestra el teléfono de servicio técnico y el
  Instagram agregados a pedido de Diego.

**Pendiente (no bloquea lo anterior, se hace cuando Diego lo pida)**:
- El resto de la actualización de `README.md` (arquitectura nueva,
  comandos, cómo agregar una colección, cómo pasar de KV a R2) — lo ya
  adelantado en la Fase 3 (sección de fotos + contenido inicial, conteo
  real de productos) sigue vigente.
- Conectar `wellbusiness-web`/`wellbusiness-portal` a Workers Builds
  (GitHub) para que un push a `master` despliegue solo, en vez de
  `wrangler deploy` manual.
- Dominio propio del portal (`portal.idrocomsolutions.com` →
  `wellbusiness-portal`) — hoy sigue solo en su URL `*.workers.dev`.
- No se hace merge a `master` (rama principal de este repo, no `main`) ni se
  toca producción/dominios sin confirmación de Diego en cada paso.

## Verificación end-to-end (además de los checkpoints de cada fase)

- `npm run build:web`, `npm run build:portal`, `npm run check:portal` — 0 errores. ✅ (Fases 1-4)
- Playwright: capturas antes/después de las 8 páginas/estados, móvil y escritorio. ✅ (Fase 4, ver arriba)
- Un producto creado/editado/archivado/eliminado en el portal se refleja en el sitio en ≤5 minutos. ✅ verificado en la Fase 4.
- Un slug de producto inexistente da 404 real. ✅ verificado en la Fase 4.
- Contenido en borrador o archivado no aparece en el sitio público. ✅ verificado en la Fase 4.
- Un envío real de cada formulario llega a "Formularios recibidos". ✅ verificado en la Fase 5.
