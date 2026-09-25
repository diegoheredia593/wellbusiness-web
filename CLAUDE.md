# CLAUDE.md

Lectura obligatoria antes de tocar cualquier cosa en este repo:

1. **`docs/ESTADO.md`** — qué es este proyecto, qué contiene cada carpeta,
   estado real de cada fase, reglas acordadas, decisiones tomadas y por
   qué, pendientes conocidos, y cómo levantar todo en local desde cero.
2. **`docs/PLAN-PORTAL.md`** — el plan completo de las 6 fases (integrar el
   portal CMS de Fluvida en Wellbusiness), con el razonamiento detrás de
   cada decisión y el estado de cada fase.
3. **`CAMBIOS-NUCLEO.md`** — todo cambio a `apps/portal/` o
   `packages/cms-core/` que en teoría también aplicaría al portal de
   Fluvida (repo separado) se documenta aquí, para portarlo a mano.

No dupliques ese contenido en este archivo — si algo cambia, actualiza
`docs/ESTADO.md` directamente.

## Reglas rápidas (el detalle completo está en `docs/ESTADO.md`)

- Rama principal: `master` (no `main`).
- No hacer merge a `master` ni tocar producción sin confirmación explícita
  de Diego.
- No hacer commits ni push en ningún otro repositorio (por ejemplo
  `fluvida-web`) sin preguntar primero.
- No inventar contenido — todo texto/dato del CMS es transcripción literal
  de lo que ya existía, o algo pedido explícitamente.
- Pausa de revisión (⏸ CHECKPOINT) al final de cada fase del plan — no
  avanzar a la siguiente sin aprobación.
