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
