# Cambios al núcleo (`apps/portal` / `packages/cms-core`)

Registro de cada cambio hecho a `apps/portal` o `packages/cms-core` durante la
integración del portal en Wellbusiness — para poder llevarlos después al repo
de Fluvida o a una futura plantilla compartida. Ambas carpetas se copiaron de
`fluvida-web` en la Fase 1 (copia de archivos, sin historial git compartido:
a partir de ese commit evolucionan de forma independiente).

Cada entrada: fecha, archivo(s), qué cambió, por qué, y si es específico de
Wellbusiness o un cambio genérico que debería portarse de vuelta a Fluvida.

---

## Fase 1 — Duplicación inicial

**`apps/portal/astro.config.mjs`**
- Cambié el valor por defecto de `CLIENTE` de `'fluvida'` a `'wellbusiness'`.
- **Específico de Wellbusiness** — cada copia del portal define su propio
  cliente por defecto; no aplica de vuelta a Fluvida.

**`apps/portal/package.json`**
- Reemplacé la dependencia `"@clientes/fluvida": "*"` por
  `"@clientes/wellbusiness": "*"`.
- **Específico de Wellbusiness.**

**`apps/portal/tsconfig.json`**
- Actualicé el alias de tipos `@cliente` de
  `../../clientes/fluvida/src/index.ts` a
  `../../clientes/wellbusiness/src/index.ts`.
- **Específico de Wellbusiness.**

**`apps/portal/worker-configuration.d.ts`**
- Eliminado (era el archivo generado por `wrangler types` para el D1/KV reales
  de Fluvida). Se regenera en la Fase 2 una vez que exista
  `clientes/wellbusiness/wrangler.portal.jsonc` con los bindings reales de
  Wellbusiness.
- **No aplica a Fluvida** (es un artefacto generado, no código).

**`packages/cms-core`**
- Sin cambios en la Fase 1 — copiado tal cual.

## Fase 2 — Configuración del cliente

**`apps/portal/worker-configuration.d.ts`**
- Regenerado con `npx wrangler types --config=../../clientes/wellbusiness/wrangler.portal.jsonc ./worker-configuration.d.ts` una vez que `clientes/wellbusiness/wrangler.portal.jsonc` ya existía (bindings `DB`/`MEDIOS`/`ASSETS` reales de Wellbusiness).
- **No aplica a Fluvida** (artefacto generado).

**`apps/portal/package.json`**
- Agregué `"@types/node": "^22.12.0"` a `devDependencies`.
- **Bug genérico, debería portarse a Fluvida**: sin esta dependencia,
  `astro.config.mjs` (`process.env.CLIENTE`) y varios archivos de
  `src/lib/servidor/*.ts` (`cloudflare:workers`, tipos ambientes de Node)
  fallan `astro check` con `Cannot find name 'process'`/`Cannot find module
  'cloudflare:workers'` — 25 errores en la primera corrida de
  `check:portal` en este repo, todos resueltos por esta única dependencia.
  Confirmé que Fluvida tampoco la tiene declarada (ni en su
  `apps/portal/package.json` ni instalada en ningún `node_modules` del
  repo) — es casi seguro que `npm run check:portal` falla igual allá; no lo
  ejecuté contra ese repo para no modificarlo, pero vale la pena que lo
  verifiquen y porten este mismo cambio.

## Fase 3 — Seguro contra fotos rotas en "Contenido inicial"

**`apps/portal/src/lib/servidor/carga.ts` (`cargarColecciones`)**
- Antes: solo validaba la forma de cada ítem con Zod (`validarCompleto`/
  `validarBorrador`) — un campo `medio` (id de una foto de la biblioteca)
  con formato válido pero que no existiera en la tabla `medios` pasaba la
  validación igual, y el ítem se creaba con una foto rota (confirmado en
  vivo: un `medios-generados.ts` con ids de una corrida local de prueba,
  cargado contra un D1 vacío, creaba 68 ítems con fotos inexistentes sin
  ningún aviso).
- Ahora: después de validar la forma, recorre cada ítem ya validado
  (`mediosReferenciados()`) juntando todo id de `medio` que use, y
  consulta la tabla `medios` una sola vez (`idsDeMedioFaltantes()`, vía
  `inArray`) para ver cuáles no existen. Si falta alguno, la carga se
  rechaza completa (ningún ítem se escribe) con un mensaje que dice
  exactamente qué foto falta y en qué ítem se usa, más el recordatorio de
  correr `scripts/importar-fotos.ts` y volver a desplegar.
- **Bug genérico, debería portarse a Fluvida**: el mismo hueco (un `medio`
  con formato válido pero inexistente crea una foto rota silenciosa) existe
  ahí igual — Fluvida hoy solo usa fotos estáticas de `apps/web/public/`
  (nunca la biblioteca de medios para contenido inicial), así que el hueco
  está dormido, pero se activaría en cuanto declare un campo `medio` en su
  propio contenido inicial.
- **No cubre bloques** (textos/imágenes de página, `sincronizar.ts`) — hoy
  ningún bloque de Wellbusiness usa una imagen de biblioteca, así que no
  era necesario para este caso; si algún cliente define un bloque `imagen`
  con `medio`, valdría la pena extender la misma verificación ahí.

**`scripts/importar-fotos.ts`** (nuevo, vive fuera de `apps/`, no es parte
del núcleo compartido — documentado aquí solo porque su flujo (`--cargar`)
llama a la misma ruta `/api/carga-inicial` que este cambio endurece).
