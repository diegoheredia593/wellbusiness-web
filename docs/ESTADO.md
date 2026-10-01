# Estado del proyecto — léeme primero

Si algo de aquí no coincide con el código o con `git log`, confía en lo que ves y actualiza este
archivo.

## Qué es

El sitio corporativo de Wellbusiness (Astro 7 + Tailwind 4 en un Worker de Cloudflare,
idrocomsolutions.com y www). **Lee su contenido y envía sus formularios a la plataforma de la
agencia** (Worker `agencia-plataforma`, repo `agencia-plataforma`). No tiene D1, KV ni portal
propios: el portal de edición es el de la plataforma y es de la agencia.

Monorepo de un solo workspace: `apps/web`. Historia: entre septiembre y octubre de 2026 el sitio
pasó de contenido en código, a un portal CMS propio (`apps/portal`, D1 + KV), y finalmente a la
plataforma (Sprint 4e, corte del 2026-09-30). Esa historia está en `git log`; `apps/portal`,
`packages/cms-core` y `clientes/` se eliminaron.

## Reglas acordadas

- Rama principal: **`master`**.
- Commits y push solo en este repo; nada en `agencia-plataforma` ni otros repos sin avisar antes.
- No se inventa contenido. Todo texto viene de la plataforma o de `apps/web/src/data/site.ts`.
- Antes de publicar un cambio visual, comparar con `scripts/capturas-visuales.ts`.

## Cómo funciona la lectura y el envío

Ver el README. Puntos que conviene recordar:

- **Service binding `PLATAFORMA`** → `agencia-plataforma`. Un fetch Worker→Worker por
  workers.dev da el error 1042, por eso el binding. En `astro dev` no hay binding y se usa la URL
  pública.
- **Una llave, dos alcances** (`contenido:leer`, `formularios:enviar`): secreto del Worker
  `PLATAFORMA_LLAVE` en producción, `apps/web/.dev.vars` en local (ignorado por git). Límite de la
  plataforma: 300 peticiones por minuto por llave.
- **Bloques**: el filtro `paginas` de la API usa la *etiqueta* de la página ("Contacto"), no el
  slug; por eso se traen los 98 bloques sin filtro, una vez por versión.
- **Cache**: memoria del Worker por versión de contenido (se consulta `/v1/version`, como máximo
  cada 15 s, y se sirve lo último conocido si esa consulta falla) + `Cache-Control` de 5 minutos
  en las páginas. Solo se guardan datos ya resueltos, nunca promesas (un Worker no puede
  compartir I/O pendiente entre peticiones).
- **Formularios**: `Origin` propio, campo señuelo `sitioWeb`, límite de 64 KB, solo
  `contacto` y `evaluacion-cobertura`. Límite de la plataforma: 5 envíos por IP cada 15 minutos.

## Fotos (y una corrección que vive en el sitio)

Las fotos las sirve la plataforma (`/media/tenants/<tenant>/fotos/...`). **La plataforma arma cada
URL de foto con el host de la petición.** Por el service binding ese host es el ficticio
`agencia-plataforma`, que no existe fuera de Cloudflare, así que las fotos salían rotas en el
navegador (ocurrió en el primer despliegue del corte, fue revertido y corregido).

Hoy el sitio lo corrige: `apps/web/src/lib/plataforma/medios.ts` reescribe ese host a
`ORIGEN_PUBLICO_PLATAFORMA` (`https://agencia-plataforma.herediadiego963.workers.dev`).
**Pendiente de la plataforma:** un origen público configurable, para que entregue siempre URLs
públicas sin depender del host de la petición. Va con el sprint del dominio propio de la
plataforma; cuando exista, `medios.ts` se simplifica o se elimina.

### Tamaños de foto (sprint 6a)

La plataforma genera para cada foto variantes webp de 480, 960 y 1600 px de ancho (nunca más anchas
que el original) y las entrega en `variantes` dentro de cada imagen. El sitio las usa con `srcset` +
`sizes`: el **único helper de imágenes es `apps/web/src/lib/fotos.ts`** (`atributosFoto`), que apoya
en `lib/plataforma/imagen.ts` (copia del SDK). Cada lugar dice con qué ancho se muestra la foto; la
imagen principal de cada página va con `fetchpriority="high"` y sin `lazy`. Una foto sin variantes
(chica o aún sin procesar) sale con solo `src`. En la galería de producto, el script que cambia la foto
principal también cambia el `srcset` (con `srcset` puesto, el navegador ignora `src`). Las imágenes PROPIAS
del sitio (logos y collage del inicio) también van en webp con tamaños (sprint 6b): los PNG originales
viven en `apps/web/imagenes-origen/`, `node scripts/optimizar-imagenes.mjs` genera los webp en
`public/images/` y el manifiesto `src/lib/imagenes-estaticas.json`, y `atributosEstatica()` de
`lib/fotos.ts` arma su `srcset`. Si cambias un PNG de `imagenes-origen/`, vuelve a correr el script y
sube los archivos generados. (`favicon.png` y `apple-touch-icon.png` siguen en PNG, como exigen los navegadores.)

## Redirecciones `/medios/<clave>`

El sitio antes servía las fotos en `/medios/<clave>` (KV). Hoy cada una de las 67 claves viejas
redirige a su foto en la plataforma: `apps/web/redirecciones-medios.json`, leído por
`astro.config.mjs` como `redirects`, que Astro emite como `_redirects` (lo sirven los assets del
Worker sin invocarlo). Una clave que no esté en el mapa da 404.

**Son 302 (temporales)** porque el destino es el workers.dev de la plataforma, que es temporal.
Cuando la plataforma tenga dominio propio: actualizar los destinos del JSON y cambiar el estado a
301 en `astro.config.mjs`. (Del 2026-09-30 17:11 al 17:22 UTC, unos 11 minutos, salieron como 301; un navegador que los haya guardado seguirá yendo al workers.dev hasta vaciar su caché.)

## Diferencias conocidas respecto al sitio anterior

- `/catalogo/rva50`: el sitio viejo tenía la palabra "PRUEBA" al final del resumen (basura de
  pruebas del portal viejo). La plataforma no la tiene.

## Despliegue

Manual desde `apps/web`: `npm run build:web` y `npm run deploy:web` (el despliegue usa
`apps/web/dist/server/wrangler.json`, que genera el build). No se observó ningún despliegue
automático (todos figuran con origen "Unknown"). Conectar Workers Builds a `master` con
`apps/web` como directorio raíz: ver `REPORTE-CORTE-WELLBUSINESS.md`.

Volver atrás: `cd apps/web && npx wrangler deployments list`, luego
`npx wrangler rollback <version-id> --yes`. Las versiones anteriores al corte (con D1/KV propios)
dejan de servir si esos recursos se borran.

## Recursos antiguos (respaldo, sin nada conectado)

- D1 `wellbusiness-db` (`2afc8400-5ed4-423d-bf72-27f7cee8ece0`) y KV `wellbusiness-medios`
  (`76a57ddc1568418ebaeb3c2d6bd8e8d2`): se conservan 30 días como respaldo. **Se pueden borrar a
  partir del 2026-10-30**, tras confirmar que ningún Worker los usa.
- Worker `wellbusiness-portal`: borrado el 2026-09-30.

## Cómo levantar en local

```sh
npm install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # poner PLATAFORMA_LLAVE
npm run dev:web                                    # http://localhost:4321
```

Comparar contra producción (requiere `npx playwright install chromium` una vez):

```sh
npx tsx scripts/capturas-visuales.ts --local http://localhost:4321 --prod https://idrocomsolutions.com --out .capturas
```

La página `/catalogo` en 390 px falla de forma intermitente en esta comparación aunque no haya
diferencia real (la captura pilla una foto a medias); ver `REPORTE-CORTE-WELLBUSINESS.md`.
