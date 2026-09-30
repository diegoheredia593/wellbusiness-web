# CLAUDE.md

Lectura obligatoria antes de tocar cualquier cosa en este repo:

1. **`docs/ESTADO.md`** — qué es este proyecto, cómo lee el contenido de la
   plataforma, decisiones, pendientes y cómo levantarlo en local.
2. **`README.md`** — estructura, comandos y despliegue.
3. **`REPORTE-CORTE-WELLBUSINESS.md`** — el corte a la plataforma: qué cambió,
   qué se verificó, cómo volver atrás y cuándo se pueden borrar D1 y KV.

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
