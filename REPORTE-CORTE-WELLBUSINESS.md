# Reporte del corte de Wellbusiness a la plataforma (Sprint 4e)

Fecha del corte: **2026-09-30**. Sitio: idrocomsolutions.com y www.

## Qué cambió

- El sitio **lee** su contenido (98 bloques y las colecciones productos, categorías, servicios,
  sectores, zonas de cobertura, FAQ, marcas, accesos rápidos y valores) de la plataforma, y
  **envía** sus dos formularios (contacto y evaluación de cobertura) a la plataforma.
- Se copió el SDK de la plataforma (sin dependencias) a `apps/web/src/lib/plataforma/`, con el
  commit de origen `7289c7fb` anotado. Service binding `PLATAFORMA` en producción; `fetch`
  normal en local.
- Una llave con los alcances `contenido:leer` y `formularios:enviar`: secreto del Worker
  `PLATAFORMA_LLAVE` en producción, `.dev.vars` en local. No está en ningún archivo del repo.
- Se quitaron del Worker los bindings de D1 y KV y la ruta `/medios/`. Las 67 URLs viejas
  `/medios/<clave>` redirigen a la foto en la plataforma.
- Formularios: se conservan `Origin` y el señuelo; se reenvía con IP y página; los 422 salen
  junto a cada campo y el 429 tiene un mensaje claro.
- **Fase 3 (retiro):** Worker `wellbusiness-portal` borrado; eliminados `apps/portal`,
  `packages/cms-core`, `clientes/`, `scripts/importar-fotos.ts`, `docs/PLAN-PORTAL.md` y
  `CAMBIOS-NUCLEO.md`; el monorepo queda con un solo workspace (`apps/web`); `README.md`,
  `docs/ESTADO.md` y `CLAUDE.md` reescritos. `feat/portal-cms` se fusionó en `master`.

## Qué se verificó (en producción, tras el último despliegue)

- 26 URLs (todas las páginas y los 19 productos) × 2 dominios: 52/52 dan 200; `/no-existe` da 404.
- 78 imágenes distintas en las 26 páginas: 78/78 cargan como imagen, ninguna con el host
  ficticio del binding. Las 67 fotos (productos y marcas) son idénticas byte a byte a las
  originales del paquete de migración (SHA-256).
- Redirecciones `/medios/<clave>`: dan **302** y llevan a una foto que carga; una clave
  desconocida da 404. Comprobado en ambos dominios tras pasar de 301 a 302.
- Contacto real en producción: llegó a la bandeja de la plataforma (cliente `wellbusiness`,
  formulario `contacto`, página `/contacto`) y se borró después. El 422 real se mostró junto al
  campo. El 429 se probó solo simulado, para no bloquear la IP.
- Comparación visual producción vs. nueva (390 y 1440 px, todas las páginas y productos):
  - `/catalogo/rva50`: producción tenía "PRUEBA" al final del resumen (resto de pruebas del portal
    viejo); la plataforma no. Es contenido, no error.
  - `/contacto` a 390 px (0,02 %): antialiasing del texto "Selecciona una opción".
  - `/catalogo` a 390 px (1–3 %): intermitencia del script de captura; comparando producción
    contra producción también falla 3 de 5 veces.

## Incidente durante el corte

La primera versión publicada (`b4bf9e26`) dejaba las fotos rotas: la plataforma arma cada URL de
foto con el host de la petición y por el binding ese host es el ficticio `agencia-plataforma`.
Se hizo rollback enseguida a `a2e9fa25`, se corrigió (`medios.ts` reescribe ese host al origen
público de la plataforma), se verificaron las imágenes en una vista previa y se republicó
(`c42a6367`). Las fotos rotas estuvieron unos pocos minutos.

## Cómo volver atrás

```sh
cd apps/web
npx wrangler deployments list
npx wrangler rollback <version-id> --yes
```

- Versión actual al cerrar esto: `63a7fce9-869d-4a7f-8171-31429574806d` (redirecciones en 302).
- Versión anterior, igual salvo por el 301: `c42a6367-a75b-44ff-ba81-f09c42a4d94f`.
- Versión anterior al corte (D1 y KV propios): `a2e9fa25-0e27-4910-8a59-a53fbf609e7a`. **Solo
  sirve mientras existan la D1 y el KV**, y mostraría el contenido viejo (el portal que lo editaba
  ya no existe). Tras el 2026-10-30 no será posible.
- Si la plataforma falla, el sitio sigue sirviendo el último contenido conocido desde la memoria
  del Worker mientras viva; no hay un segundo origen de contenido.

## D1 y KV antiguos: cuándo se pueden borrar

- D1 `wellbusiness-db` (`2afc8400-5ed4-423d-bf72-27f7cee8ece0`) y KV `wellbusiness-medios`
  (`76a57ddc1568418ebaeb3c2d6bd8e8d2`) **no se borraron**; quedan como respaldo 30 días.
- Comprobado el 2026-09-30 sobre los 16 Workers de la cuenta: ninguno los usa (solo
  `wellbusiness-portal` los usaba y ya está borrado; `wellbusiness-web` ya no los declara).
- **Se pueden borrar a partir del 2026-10-30.** Antes de hacerlo, repetir esa comprobación.

## Redirecciones: 302 ahora, 301 después

Las 67 redirecciones `/medios/<clave>` son **302** porque apuntan a
`agencia-plataforma.herediadiego963.workers.dev`, que es temporal. **Se vuelven 301 cuando la
plataforma tenga dominio propio** (actualizar los destinos de `apps/web/redirecciones-medios.json`
y el estado en `apps/web/astro.config.mjs`).

Salieron como 301 del 2026-09-30 17:11 al 17:22 UTC (unos 11 minutos). Un navegador que haya
seguido una en ese rato puede haberla guardado y seguirá yendo al workers.dev hasta vaciar su
caché. Es poco probable que afecte a alguien: son URLs de fotos que casi nadie visita directo.

## Pendientes de la plataforma

- **Las URLs de fotos se derivan del host de la petición.** Hoy el sitio lo corrige reescribiendo
  el host (`apps/web/src/lib/plataforma/medios.ts`, constante `ORIGEN_PUBLICO_PLATAFORMA`). La
  corrección de fondo es un **origen público configurable en la plataforma**, que va con el sprint
  del dominio propio; entonces esa reescritura se simplifica o se elimina.
- Con el dominio propio también hay que actualizar los destinos de las redirecciones (arriba).

## Workers Builds (despliegue automático)

**Estado: no se pudo confirmar, y no hay señales de que esté conectado.** Todos los despliegues
de `wellbusiness-web` figuran con origen "Unknown" (manuales, hechos con `wrangler`), y el token
de `wrangler` no tiene permiso para leer Workers Builds por la API. Hay que mirarlo en el panel:
Workers & Pages → `wellbusiness-web` → Settings → Build. Si dice "Connect" en vez de un
repositorio, no está conectado.

Pasos para conectarlo a `master` con `apps/web` como directorio raíz:

1. Panel de Cloudflare → Workers & Pages → `wellbusiness-web` → **Settings** → **Build** →
   **Connect** (autorizar la app de GitHub sobre `diegoheredia593/wellbusiness-web`).
2. Repositorio `wellbusiness-web`, **Production branch: `master`**.
3. **Root directory: `apps/web`**.
4. **Build command:** `npm ci --prefix ../.. && npm run build` (el lockfile está en la raíz del
   monorepo; si el panel ya instala desde la raíz, basta `npm run build`).
5. **Deploy command:** `npx wrangler deploy --config dist/server/wrangler.json` (el build genera
   ese archivo; el `wrangler.toml` de `apps/web` por sí solo no sirve para desplegar con el
   adaptador de Astro).
6. **Variables de build:** ninguna. El secreto `PLATAFORMA_LLAVE` ya está en el Worker y no se
   pierde al desplegar.
7. **Builds de ramas que no son de producción:** déjalos desactivados, para que una rama no
   despliegue sobre producción.
8. Haz un push trivial a `master` y comprueba en el panel que el build termina y aparece una
   versión nueva con origen "Git".

El nombre del Worker en `apps/web/wrangler.toml` debe coincidir con el del panel; ya es
`wellbusiness-web`.
