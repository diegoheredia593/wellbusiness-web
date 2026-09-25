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
| 5 — Formularios | ⏳ No iniciada (pausada explícitamente antes de escribir código, para hacer este traspaso) | — |
| 6 — Documentación y despliegue | ⏳ No iniciada (algunas piezas ya viven en `README.md` desde la Fase 3, ver abajo) | — |

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
6. **Los formularios públicos NO están conectados a D1 en ningún lado
   todavía** — ni siquiera en Fluvida (esto sigue siendo cierto: es
   exactamente el trabajo pendiente de la Fase 5).
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

## Fase 5 — Formularios ⏳ NO INICIADA

- `envios_formulario` **sigue sin estar conectado en ningún lado** (ver
  hallazgo 6 — esto no cambió). Falta construir el guardado real: en
  `apps/web/src/pages/api/formularios/[tipo].ts`, después de la validación
  Zod + honeypot que ya existen, insertar en D1 (`id, tipo, datos JSON,
  creado`) y aplicar rate-limit por IP.
- El rate-limiter (`limitar()`) hoy vive solo en
  `apps/portal/src/lib/servidor/limites.ts` (privado del portal). Falta
  **promoverlo a `packages/cms-core`** (es genérico, no tiene nada
  específico del portal) para que tanto `apps/portal` como `apps/web` lo
  importen del mismo lugar — este cambio va a `CAMBIOS-NUCLEO.md`.
- CORS: la ruta debe aceptar solo el mismo origen o
  `https://idrocomsolutions.com` / `https://www.idrocomsolutions.com`
  explícitamente.
- Falta declarar `contacto` y `evaluacion-cobertura` como
  `DefinicionFormulario` en `clientes/wellbusiness/src/index.ts` (con las
  etiquetas de campo/opciones en español que ya usan
  `ContactForm.astro`/`EvaluationForm.astro`).
- Mantener `?motivo=&producto=` en el flujo de `/contacto` sin cambios.
- Fuera de alcance de esta fase (anotado, no se construye): verificación
  Turnstile — queda como mejora futura documentada.

**⏸ CHECKPOINT pendiente**: un envío real de cada formulario debe aparecer
en "Formularios recibidos" del portal.

**Siguiente paso exacto para retomar esta fase**: ver la sección "Siguiente
paso" en `docs/ESTADO.md`.

## Fase 6 — Documentación y despliegue ⏳ NO INICIADA (parcialmente adelantada)

- Ya adelantado durante la Fase 3 (sin esperar a la Fase 6): la sección
  "Portal CMS — orden exacto para cargar fotos + contenido inicial" del
  `README.md`, y la corrección del conteo real de productos/nombre real
  del hero que ya estaban desactualizados.
- Falta: el resto de la actualización de `README.md` (arquitectura nueva,
  comandos, cómo agregar una colección, cómo pasar de KV a R2).
- Lista de pasos para Diego en Cloudflare (alto nivel, se detallan con
  comandos exactos cuando se llegue a esta fase):
  1. Crear D1 `wellbusiness-db` y KV `wellbusiness-medios` — vía las
     herramientas MCP de Cloudflare, pidiendo confirmación antes de crear
     cada recurso.
  2. Crear el worker `wellbusiness-portal` conectado a GitHub vía Workers
     Builds (UI del dashboard, no por API).
  3. Cambiar la configuración de build del worker `wellbusiness-web` (ahora
     compila desde `apps/web`).
  4. Secretos `BETTER_AUTH_SECRET`/`SETUP_SECRET` con `--name wellbusiness-portal`.
  5. Dominio `portal.idrocomsolutions.com` → `wellbusiness-portal`.
  6. `/configuracion-inicial` → crear el primer administrador.
  7. **Fotos, en este orden exacto** (el portal rechaza el paso 8 si se
     salta este orden — ver "Portal CMS — orden exacto..." en `README.md`):
     1. `npx tsx scripts/importar-fotos.ts --url https://portal.idrocomsolutions.com --email ... --password ...`
        — sube las ~67 fotos reales y regenera `medios-generados.ts`.
     2. Revisar y comitear ese archivo regenerado.
     3. Esperar a que Workers Builds despliegue (o `npm run deploy:portal`).
  8. Recién ahora: `/carga-inicial` → "Cargar" (o el mismo script con
     `--cargar`) → probar crear/publicar/archivar/eliminar un producto y
     verlo reflejado en el sitio.
- No se hace merge a `master` (rama principal de este repo, no `main`) ni se
  toca producción sin confirmación de Diego. La configuración de Workers
  Builds de `wellbusiness-portal`/`wellbusiness-web` en la Fase 6 debe
  apuntar su rama de producción a `master`.

## Verificación end-to-end (además de los checkpoints de cada fase)

- `npm run build:web`, `npm run build:portal`, `npm run check:portal` — 0 errores. ✅ (Fases 1-4)
- Playwright: capturas antes/después de las 8 páginas/estados, móvil y escritorio. ✅ (Fase 4, ver arriba)
- Un producto creado/editado/archivado/eliminado en el portal se refleja en el sitio en ≤5 minutos. ✅ verificado en la Fase 4.
- Un slug de producto inexistente da 404 real. ✅ verificado en la Fase 4.
- Contenido en borrador o archivado no aparece en el sitio público. ✅ verificado en la Fase 4.
- Un envío real de cada formulario llega a "Formularios recibidos". ⏳ pendiente (Fase 5).
