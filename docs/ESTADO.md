# Estado del proyecto — léeme primero

Este archivo está pensado para que una sesión nueva de Claude Code (o
cualquier persona) pueda retomar este trabajo sin haber visto la
conversación anterior. Si algo aquí no coincide con lo que ves en el
código o en `git log`, **confía en lo que ves ahora** y actualiza este
archivo — no al revés.

Ver también `docs/PLAN-PORTAL.md` (el plan completo de las 6 fases, con el
razonamiento detrás de cada decisión) y `CAMBIOS-NUCLEO.md` (cambios a
`apps/portal`/`packages/cms-core` que también aplican a Fluvida).

## Qué es este proyecto

Wellbusiness es un sitio corporativo (Astro 7 + Tailwind 4, Cloudflare
Workers) al que se le está integrando el portal CMS que Diego ya construyó
para otro cliente (Fluvida): Astro 7 SSR + React 19 + D1 (SQLite en el
borde) + Drizzle + Better Auth + Zod 4. El objetivo final: que Diego pueda
editar catálogo, servicios, sectores, cobertura, FAQ, logos y textos del
sitio sin tocar código, desde un portal de administración propio.

Es un monorepo con npm workspaces:

```
wellbusiness-web/
├── apps/web/               El sitio público (idrocomsolutions.com). Astro,
│                           lee su contenido de D1 a través de
│                           apps/web/src/lib/content/ — nunca de src/data/*.ts
│                           (esos archivos ya no existen salvo lo que se
│                           quedó como taxonomía fija en código, ver
│                           apps/web/src/data/site.ts).
├── apps/portal/            El portal de administración (futuro
│                           portal.idrocomsolutions.com). Es una COPIA de
│                           archivos del portal de Fluvida — no un
│                           submódulo git, no comparte historial. A partir
│                           de aquí evoluciona por separado; cualquier
│                           cambio que aplique a ambos se documenta en
│                           CAMBIOS-NUCLEO.md para portarlo a mano.
├── packages/cms-core/      El núcleo genérico del CMS (esquemas Zod,
│                           fuente de contenido D1, definición de cliente,
│                           almacenamiento KV/R2). También es una copia de
│                           Fluvida. Nada aquí debe saber nada específico
│                           de Wellbusiness ni de Fluvida.
└── clientes/wellbusiness/  La configuración propia de este cliente:
                            bloques de texto, esquemas de colecciones,
                            el contenido inicial transcrito, colores/
                            zona horaria/límites, y wrangler.portal.jsonc
                            (la config de Cloudflare del portal).
```

`scripts/` (en la raíz, fuera de `apps/`) tiene herramientas de una sola
vez o reutilizables — no son parte de ninguna app:
- `importar-fotos.ts` — sube las fotos reales de producto/marca a la
  biblioteca de medios del portal (nunca las deja como archivos estáticos
  del sitio). Ver su propio comentario de cabecera para el uso completo.
- `capturas-visuales.ts` — compara visualmente dos versiones del sitio
  (producción vs. local, o cualquier otro par) página completa, móvil y
  escritorio. Se escribió para verificar la Fase 4 antes de aprobar la
  Fase 5, y queda para cualquier cambio visual futuro.

## Estado por fase

Ver `docs/PLAN-PORTAL.md` para el detalle completo de cada fase (qué se
decidió, qué se verificó, con qué commit). Resumen:

| Fase | Estado |
|---|---|
| 1 — Monorepo | ✅ Completa y verificada |
| 2 — Configuración del cliente | ✅ Completa y verificada |
| 3 — Contenido inicial y fotos | ✅ Completa y verificada |
| 4 — El sitio lee desde D1 | ✅ Completa y verificada (incluye comparación visual Playwright prod vs. local, 404/noindex, conteo de consultas D1, Cache-Control — todo confirmado en orden) |
| 5 — Formularios | ⏳ **No iniciada.** Se pausó explícitamente antes de escribir código para hacer este traspaso — no hay trabajo a medias que rescatar. |
| 6 — Documentación y despliegue | ⏳ No iniciada (algunas piezas ya están hechas desde la Fase 3, ver `docs/PLAN-PORTAL.md`) |

Commit más reciente en `feat/portal-cms` al momento de escribir esto: ver
`git log -1 feat/portal-cms` — no lo fijo aquí como número porque este
archivo se desactualizaría en el primer commit nuevo; el hash real está en
el mensaje de traspaso que Diego recibió al cerrar esta sesión.

## Reglas acordadas (siguen vigentes, no negociarlas por tu cuenta)

- La rama principal de este repo es **`master`**, no `main`.
- **No se hace merge a `master` ni se toca producción sin confirmación
  explícita de Diego.**
- **No se hacen commits ni push en ningún otro repositorio** (por ejemplo
  `fluvida-web`) **sin preguntar primero.**
- Cada cambio a `apps/portal/` o `packages/cms-core/` que en teoría también
  aplicaría a Fluvida se documenta en `CAMBIOS-NUCLEO.md`, en un commit
  separado — nunca se aplica a Fluvida automáticamente.
- No se inventa contenido: todo texto/dato que entra a `clientes/wellbusiness/src/colecciones.ts`
  o a los bloques es una transcripción literal de lo que ya existía en
  `src/data/*.ts`/las páginas `.astro` originales, o algo que Diego pidió
  explícitamente.
- Hay una pausa de revisión (**⏸ CHECKPOINT**) al final de cada fase — no
  se avanza a la siguiente sin que Diego la apruebe (puede aprobar con
  ajustes, como pasó en las Fases 2, 3 y esta verificación previa a la
  Fase 5).

## Decisiones tomadas y por qué

- **Las fotos de producto/marca viven en la biblioteca de medios del
  portal (tabla `medios` + KV), nunca en `public/` del sitio.** Se intentó
  primero el enfoque de Fluvida (fotos como archivos estáticos con rutas
  `/images/...`) pero Diego verificó en vivo que esas rutas se ven rotas
  dentro del portal (vive en otro dominio) y pidió revertir al plan
  original. Las fotos de **diseño** (hero, logo del sitio) sí se quedan en
  `public/images/{hero,brand}/` — nunca entran al CMS.
- **Reparto del KV gratuito de Cloudflare (1 GB) entre Wellbusiness y
  Fluvida, misma cuenta**: 400 MB Wellbusiness / 500 MB Fluvida.
  Documentado en un comentario en `clientes/wellbusiness/src/index.ts` y en
  el equivalente de Fluvida.
- **El 404 se genera en el servidor (`prerender = false`), no es una
  página estática.** Motivo técnico real, no preferencia: Astro no permite
  un `Astro.rewrite()` hacia una ruta prerenderizada desde una ruta
  dinámica (`/catalogo/[slug]`) — confirmado en vivo ("ForbiddenRewrite").
  El contenido del 404 sigue siendo 100% fijo en código, nunca toca D1;
  solo cambió CÓMO se renderiza.
- **Orden exacto para producción**: importar fotos (`scripts/importar-fotos.ts`
  contra el portal ya desplegado) → revisar y comitear
  `medios-generados.ts` → desplegar el portal → recién ahí, cargar
  contenido inicial (`--cargar` o el botón "Cargar"). El portal rechaza el
  último paso con un mensaje claro si se salta el orden (ver
  `apps/portal/src/lib/servidor/carga.ts` y "Pendientes conocidos" abajo).
- **La barra de herramientas de desarrollo de Astro está desactivada en
  ambas apps** (`devToolbar: { enabled: false }`) — es un overlay que solo
  existe en `astro dev`, nunca en producción, y contaminaba cualquier
  comparación visual local.

## Pendientes conocidos (no son bugs escondidos — están anotados a propósito)

- `clientes/wellbusiness/wrangler.portal.jsonc` y `apps/web/wrangler.toml`
  todavía tienen ids de relleno (`00000000-...`) para `database_id` (D1) y
  el namespace KV — se llenan en la Fase 6, cuando se crean los recursos
  reales de Cloudflare.
- `clientes/wellbusiness/src/medios-generados.ts` (committeado) tiene ids
  de una base D1 **local y descartable** de una sesión de prueba anterior
  — no corresponden a ningún medio real en Cloudflare todavía. Este
  archivo se **regenera por completo** corriendo
  `scripts/importar-fotos.ts` contra el portal ya desplegado (Fase 6, paso
  7 del plan) — no hay que "arreglarlo" a mano, correr el script de nuevo
  lo reemplaza entero.
- `/catalogo` hace una consulta a la colección `categorias` **dos veces**
  en la misma solicitud (una vez dentro de `getProductos()` para resolver
  slug→nombre, otra vez para la lista de pestañas). No rompe nada ni se
  acerca al límite de 50 subconsultas del plan gratis de D1 — es solo una
  pequeña optimización pendiente si algún día importa. Ver
  `apps/web/src/lib/content/index.ts` (`mapaCategorias()` / `getCategorias()`)
  y `apps/web/src/pages/catalogo/index.astro`.
- Fase 5 (formularios) no está empezada — ver `docs/PLAN-PORTAL.md` para el
  detalle completo de qué falta.

## Cómo levantar todo en local desde cero

Esto asume Node 22+ instalado y el repo recién clonado (rama
`feat/portal-cms`). Todos los comandos son desde la raíz del repo salvo que
se indique lo contrario.

### 1. Instalar dependencias

```
npm ci
```

### 2. Secretos locales del portal

El portal necesita `BETTER_AUTH_SECRET` (32+ caracteres) y `SETUP_SECRET`
(12+ caracteres) para levantar en local. **Ojo con la ubicación**: aunque
el código del portal vive en `apps/portal/`, el adaptador de Cloudflare lee
`.dev.vars` junto al archivo de configuración de Wrangler que se le pasa
por `configPath` — es decir, junto a `clientes/wellbusiness/wrangler.portal.jsonc`,
**no** junto a `apps/portal/`. Confirmado en vivo: un `.dev.vars` en
`apps/portal/` se ignora en silencio.

```
cp clientes/wellbusiness/.dev.vars.example clientes/wellbusiness/.dev.vars
```

Y rellena los dos valores (instrucciones de cómo generarlos dentro del
propio archivo `.example`).

### 3. Levantar el portal en local (D1 y KV emulados por Wrangler)

```
cd apps/portal
npx astro dev --port 4321
```

Wrangler/Miniflare crea automáticamente una D1 y un KV **locales**
(persistidos en `apps/portal/.wrangler/`, gitignored) la primera vez que
arranca — no hace falta crear nada a mano para desarrollo local.

### 4. Crear el primer administrador

El portal no tiene ningún admin hasta que se crea uno vía
`/configuracion-inicial`. Es más simple hacerlo por API directamente
(ojo con el header `Origin`, la protección CSRF de Astro lo exige):

```
curl -X POST http://localhost:4321/api/publico/configuracion-inicial \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{"clave":"<el mismo valor que puso en SETUP_SECRET>","nombre":"Tu Nombre","email":"admin@ejemplo.local","contrasena":"UnaContraseñaSegura123!"}'
```

Debe responder `{"ok":true}`.

### 5. Importar fotos + cargar contenido inicial

`scripts/importar-fotos.ts` lee las fotos reales desde
`apps/web/public/images/{products,logos}/` — **estas carpetas ya no
existen en el repo** (se borraron al terminar la Fase 4, están migradas a
la biblioteca de medios). Para poder correr el script en local hay que
restaurarlas temporalmente desde un commit anterior a esa migración y
volver a borrarlas después:

```
git checkout 8b538c2 -- apps/web/public/images/products apps/web/public/images/logos

npx tsx scripts/importar-fotos.ts \
  --url http://localhost:4321 \
  --email admin@ejemplo.local \
  --password "UnaContraseñaSegura123!" \
  --cargar

rm -rf apps/web/public/images/products apps/web/public/images/logos
git status --short apps/web/public/images   # debe salir vacío (net-zero)
```

El flag `--cargar` hace en un solo paso lo que en producción son dos pasos
separados por un despliegue (ver `docs/PLAN-PORTAL.md`, Fase 6) — en local
no hace falta ese despliegue intermedio porque el portal ya está corriendo
el código que conoce los ids que el script acaba de generar.

### 6. Levantar el sitio en local, leyendo la MISMA D1 local que el portal

Este es el paso menos obvio de todos. Por defecto, `apps/portal` y
`apps/web` cada uno crea su **propia** D1/KV local (Miniflare las aísla por
proyecto) — si simplemente corres `npm run dev:web`, el sitio va a ver una
base de datos vacía, sin el contenido que acabas de cargar en el paso 5.

Para que ambos compartan el mismo estado local hay que agregar
temporalmente la misma opción `persistState` a **ambos**
`astro.config.mjs` (`apps/portal/astro.config.mjs` y
`apps/web/astro.config.mjs`), dentro de la llamada a `cloudflare({...})`:

```js
persistState: { path: '../../.wrangler-local-shared' },
```

(`.wrangler-local-shared/` en la raíz del repo ya está en `.gitignore` —
no aparece en `git status` aunque exista en disco.)

Con eso puesto en los dos archivos, reinicia el portal (paso 3) y levanta
el sitio en otro puerto:

```
cd apps/web
npx astro dev --port 4322
```

Ahora `http://localhost:4322/` debe mostrar el contenido real (no el de
`src/data/*.ts`, que ya no existe). Prueba `http://localhost:4322/catalogo/rva50`.

**Cuando termines de probar, revierte el `persistState` en ambos
`astro.config.mjs`** (o simplemente no lo comitees — es un cambio de
desarrollo local, nunca debe llegar a producción) y borra
`.wrangler-local-shared/` si quieres liberar espacio.

### 7. (Opcional) Comparar visualmente contra producción

```
npx playwright install chromium   # una sola vez
npm run capturas:visuales -- --local http://localhost:4322 --prod https://idrocomsolutions.com
```

Reporte en `.capturas/reporte.json` (gitignored).

### Verificaciones rápidas sin nada de esto

Estas no necesitan D1/KV levantados, solo las dependencias instaladas:

```
npm run build:web
npm run check:web
npm run build:portal
npm run check:portal
```

Las cuatro deben terminar sin errores.

## Siguiente paso exacto para retomar

1. Empezar la **Fase 5** (formularios) siguiendo el detalle en
   `docs/PLAN-PORTAL.md` — el trabajo central es: guardar los envíos reales
   en D1 (`envios_formulario`) desde
   `apps/web/src/pages/api/formularios/[tipo].ts`, promover `limitar()` de
   `apps/portal/src/lib/servidor/limites.ts` a `packages/cms-core` (con su
   entrada en `CAMBIOS-NUCLEO.md`), CORS restringido al dominio real, y
   declarar `contacto`/`evaluacion-cobertura` como `DefinicionFormulario`
   en `clientes/wellbusiness/src/index.ts`.
2. Al terminar la Fase 5: **⏸ CHECKPOINT** — reportar a Diego y esperar su
   aprobación antes de tocar nada de la Fase 6 (recursos reales de
   Cloudflare, dominios, despliegue).
