/**
 * Ítems de colecciones: listar, crear, editar, cambiar estado, reordenar,
 * papelera (30 días) y modo "requiere aprobación".
 */
import { env } from 'cloudflare:workers';
import cliente from '@cliente';
import { CAMPOS_BASE, describirObjeto, normalizarValores, type Campo } from '@cms/core/campos';
import { validarBorrador, validarCompleto, type Errores } from '@cms/core/validacion';
import type { DefinicionColeccion, EstadoItem } from '@cms/core/schema';
import { registro, type Accion } from './auditoria';
import { toD1 } from './db';
import type { UsuarioSesion } from './tipos';

export interface FilaItem {
  id: string;
  coleccion: string;
  slug: string | null;
  estado: EstadoItem;
  orden: number;
  datos: Record<string, unknown>;
  datosBorrador: Record<string, unknown> | null;
  creado: string;
  actualizado: string;
  eliminadoEn: string | null;
  autor: string | null;
}

interface FilaCruda {
  id: string;
  coleccion: string;
  slug: string | null;
  estado: EstadoItem;
  orden: number;
  datos: string;
  datos_borrador: string | null;
  creado: string;
  actualizado: string;
  eliminado_en: string | null;
  autor: string | null;
}

const COLUMNAS = 'id, coleccion, slug, estado, orden, datos, datos_borrador, creado, actualizado, eliminado_en, autor';

function aItem(f: FilaCruda): FilaItem {
  return {
    id: f.id,
    coleccion: f.coleccion,
    slug: f.slug,
    estado: f.estado,
    orden: f.orden,
    datos: JSON.parse(f.datos) as Record<string, unknown>,
    datosBorrador: f.datos_borrador ? (JSON.parse(f.datos_borrador) as Record<string, unknown>) : null,
    creado: f.creado,
    actualizado: f.actualizado,
    eliminadoEn: f.eliminado_en,
    autor: f.autor,
  };
}

// ─── Definiciones ──────────────────────────────────────────────────────────

const cacheCampos = new Map<string, Campo[]>();

export function definicion(nombre: string): DefinicionColeccion | null {
  return (cliente.colecciones as Record<string, DefinicionColeccion>)[nombre] ?? null;
}

export function camposDe(nombre: string): Campo[] {
  let c = cacheCampos.get(nombre);
  if (!c) {
    const def = definicion(nombre);
    if (!def) return [];
    c = describirObjeto(def.schema, CAMPOS_BASE);
    cacheCampos.set(nombre, c);
  }
  return c;
}

export function tituloDe(nombre: string, datos: Record<string, unknown>) {
  const def = definicion(nombre);
  const v = def ? datos[def.campoTitulo] : null;
  return typeof v === 'string' && v.trim() ? v.trim() : 'Sin título';
}

export function puedeEliminar(usuario: UsuarioSesion) {
  return usuario.rol === 'admin' || cliente.portal.editores.eliminar;
}

/** ¿Lo que guarda este usuario queda en revisión? */
export function enRevision(usuario: UsuarioSesion) {
  return cliente.portal.requiereAprobacion && usuario.rol !== 'admin';
}

// ─── Lectura ───────────────────────────────────────────────────────────────

/** Ítems de una colección (sin la papelera), en su orden. */
export async function listar(coleccion: string): Promise<FilaItem[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNAS} FROM items WHERE coleccion = ? AND eliminado_en IS NULL ORDER BY orden, creado`,
  )
    .bind(coleccion)
    .all<FilaCruda>();
  const items = results.map(aItem);
  const def = definicion(coleccion);
  if (def?.ordenarPor && def.ordenarPor !== 'orden') {
    const campo = def.ordenarPor.campo;
    items.sort((a, b) => String(b.datos[campo] ?? '').localeCompare(String(a.datos[campo] ?? '')) || a.orden - b.orden);
  }
  return items;
}

export async function obtener(coleccion: string, id: string): Promise<FilaItem | null> {
  const f = await env.DB.prepare(`SELECT ${COLUMNAS} FROM items WHERE id = ? AND coleccion = ?`)
    .bind(id, coleccion)
    .first<FilaCruda>();
  return f ? aItem(f) : null;
}

/** Valores de una relación (p. ej. categorías para elegir en una noticia). */
export async function opcionesRelacion(campos: Campo[]) {
  const relaciones = campos.filter((c) => c.control === 'relacion' && c.relacion);
  const salida: Record<string, { valor: string; etiqueta: string; estado: EstadoItem }[]> = {};
  for (const c of relaciones) {
    const r = c.relacion!;
    const items = await listar(r.coleccion);
    salida[c.nombre] = items
      .map((i) => ({ valor: String(i.datos[r.valor] ?? ''), etiqueta: String(i.datos[r.etiqueta] ?? ''), estado: i.estado }))
      .filter((o) => o.valor);
  }
  return salida;
}

// ─── Escritura ─────────────────────────────────────────────────────────────

export type Resultado<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; status: number; error: string; campos?: Errores };

/** Guardar con el estado pedido: `borrador` admite datos incompletos; publicar exige todo. */
function validar(nombre: string, datos: Record<string, unknown>, estado: EstadoItem) {
  const def = definicion(nombre)!;
  const limpio = normalizarValores(camposDe(nombre), datos);
  return estado === 'borrador' ? validarBorrador(def, limpio) : validarCompleto(def, limpio);
}

async function comprobarRelaciones(nombre: string, datos: Record<string, unknown>): Promise<Errores> {
  const errores: Errores = {};
  const opciones = await opcionesRelacion(camposDe(nombre));
  for (const [campo, lista] of Object.entries(opciones)) {
    const v = datos[campo];
    if (v !== null && v !== undefined && v !== '' && !lista.some((o) => o.valor === v)) {
      errores[campo] = 'Esa opción ya no existe. Elige otra.';
    }
  }
  return errores;
}

function slugDe(nombre: string, datos: Record<string, unknown>) {
  const campo = definicion(nombre)?.campoSlug;
  const v = campo ? datos[campo] : null;
  return typeof v === 'string' && v ? v : null;
}

function errorDeBase(e: unknown, nombre: string): Resultado<never> {
  const msg = String((e as Error)?.message ?? e);
  if (msg.includes('UNIQUE') && msg.includes('slug')) {
    const def = definicion(nombre)!;
    const campo = def.campoSlug ?? 'slug';
    return {
      ok: false,
      status: 409,
      error: 'Ya existe otro elemento con esa dirección. Cámbiala un poco.',
      campos: { [campo]: 'Ya está en uso. Agrega una palabra o un año.' },
    };
  }
  throw e;
}

export async function crear(
  usuario: UsuarioSesion,
  nombre: string,
  datos: Record<string, unknown>,
  estadoPedido: EstadoItem,
): Promise<Resultado> {
  const estado: EstadoItem = enRevision(usuario) ? 'borrador' : estadoPedido === 'archivado' ? 'borrador' : estadoPedido;
  const v = validar(nombre, datos, estado);
  if (!v.ok) return { ok: false, status: 422, error: 'Revisa los campos marcados.', campos: v.errores };
  const rel = await comprobarRelaciones(nombre, v.datos);
  if (Object.keys(rel).length) return { ok: false, status: 422, error: 'Revisa los campos marcados.', campos: rel };

  const id = crypto.randomUUID();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO items (id, coleccion, slug, estado, orden, datos, autor)
         VALUES (?, ?, ?, ?, (SELECT coalesce(max(orden), 0) + 1 FROM items WHERE coleccion = ?2), ?, ?)`,
      ).bind(id, nombre, slugDe(nombre, v.datos), estado, JSON.stringify(v.datos), usuario.id),
      toD1(
        registro(usuario, {
          accion: estado === 'publicado' ? 'publicar' : 'crear',
          objetoTipo: 'item',
          objetoId: id,
          objetoNombre: tituloDe(nombre, v.datos),
          contexto: nombre,
        }),
      ),
    ]);
  } catch (e) {
    return errorDeBase(e, nombre);
  }
  return { ok: true, id };
}

/**
 * Guarda cambios de un ítem existente, con el estado pedido.
 * En modo revisión, un editor que edita algo publicado deja los cambios en
 * `datos_borrador` para que un admin los apruebe.
 */
export async function actualizar(
  usuario: UsuarioSesion,
  nombre: string,
  id: string,
  datos: Record<string, unknown>,
  estadoPedido: EstadoItem,
): Promise<Resultado<{ id: string; revision: boolean }>> {
  const actual = await obtener(nombre, id);
  if (!actual || actual.eliminadoEn) return { ok: false, status: 404, error: 'Este elemento ya no existe.' };

  const revision = enRevision(usuario) && actual.estado !== 'borrador';
  const estado: EstadoItem = revision ? actual.estado : enRevision(usuario) ? 'borrador' : estadoPedido;
  // En revisión se valida como si se fuera a publicar: el admin solo aprueba.
  const v = validar(nombre, datos, revision ? 'publicado' : estado);
  if (!v.ok) return { ok: false, status: 422, error: 'Revisa los campos marcados.', campos: v.errores };
  const rel = await comprobarRelaciones(nombre, v.datos);
  if (Object.keys(rel).length) return { ok: false, status: 422, error: 'Revisa los campos marcados.', campos: rel };

  const accion: Accion = revision
    ? 'enviar_revision'
    : estado !== actual.estado
      ? estado === 'publicado'
        ? 'publicar'
        : estado === 'archivado'
          ? 'archivar'
          : 'despublicar'
      : 'editar';

  const sentencia = revision
    ? env.DB.prepare(
        `UPDATE items SET datos_borrador = ?, actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND coleccion = ?`,
      ).bind(JSON.stringify(v.datos), id, nombre)
    : env.DB.prepare(
        `UPDATE items SET datos = ?, slug = ?, estado = ?, datos_borrador = NULL,
           actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND coleccion = ?`,
      ).bind(JSON.stringify(v.datos), slugDe(nombre, v.datos), estado, id, nombre);

  try {
    await env.DB.batch([
      sentencia,
      toD1(
        registro(usuario, {
          accion,
          objetoTipo: 'item',
          objetoId: id,
          objetoNombre: tituloDe(nombre, v.datos),
          contexto: nombre,
        }),
      ),
    ]);
  } catch (e) {
    return errorDeBase(e, nombre);
  }
  return { ok: true, id, revision };
}

/** Cambia solo el estado (publicar, pasar a borrador, archivar, restaurar). */
export async function cambiarEstado(
  usuario: UsuarioSesion,
  nombre: string,
  id: string,
  estado: EstadoItem,
): Promise<Resultado> {
  const actual = await obtener(nombre, id);
  if (!actual || actual.eliminadoEn) return { ok: false, status: 404, error: 'Este elemento ya no existe.' };
  if (enRevision(usuario) && estado !== 'borrador') {
    return { ok: false, status: 403, error: 'Solo un administrador puede publicar o archivar.' };
  }
  if (estado !== 'borrador') {
    const v = validarCompleto(definicion(nombre)!, actual.datos);
    if (!v.ok) {
      return {
        ok: false,
        status: 422,
        error: 'Para publicar, completa los campos obligatorios. Abre el elemento para ver qué falta.',
        campos: v.errores,
      };
    }
  }
  const accion: Accion =
    estado === 'publicado' ? (actual.estado === 'archivado' ? 'restaurar' : 'publicar') : estado === 'archivado' ? 'archivar' : 'despublicar';
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE items SET estado = ?, actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND coleccion = ?`,
    ).bind(estado, id, nombre),
    toD1(registro(usuario, { accion, objetoTipo: 'item', objetoId: id, objetoNombre: tituloDe(nombre, actual.datos), contexto: nombre })),
  ]);
  return { ok: true, id };
}

/** Aprueba o descarta los cambios en revisión de un ítem (solo admin). */
export async function resolverRevision(usuario: UsuarioSesion, nombre: string, id: string, aprobar: boolean): Promise<Resultado> {
  const actual = await obtener(nombre, id);
  if (!actual?.datosBorrador) return { ok: false, status: 404, error: 'No hay cambios pendientes.' };
  const datos = aprobar ? actual.datosBorrador : actual.datos;
  try {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE items SET datos = ?, slug = ?, datos_borrador = NULL, actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND coleccion = ?`,
      ).bind(JSON.stringify(datos), slugDe(nombre, datos), id, nombre),
      toD1(
        registro(usuario, {
          accion: aprobar ? 'aprobar' : 'descartar',
          objetoTipo: 'item',
          objetoId: id,
          objetoNombre: tituloDe(nombre, datos),
          contexto: nombre,
        }),
      ),
    ]);
  } catch (e) {
    return errorDeBase(e, nombre);
  }
  return { ok: true, id };
}

/** Nuevo orden manual: la lista completa de ids en el orden deseado. Una sola consulta. */
export async function reordenar(usuario: UsuarioSesion, nombre: string, ids: string[]): Promise<Resultado<{ ok: true }>> {
  const def = definicion(nombre);
  if (def?.ordenarPor && def.ordenarPor !== 'orden') return { ok: false, status: 400, error: 'Esta lista se ordena sola por fecha.' };
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE items SET orden = j.key + 1 FROM json_each(?) AS j WHERE items.id = j.value AND items.coleccion = ?`,
    ).bind(JSON.stringify(ids), nombre),
    toD1(registro(usuario, { accion: 'reordenar', objetoTipo: 'item', contexto: nombre })),
  ]);
  return { ok: true };
}

/** Manda a la papelera. */
export async function eliminar(usuario: UsuarioSesion, nombre: string, id: string): Promise<Resultado> {
  if (!puedeEliminar(usuario)) return { ok: false, status: 403, error: 'Solo un administrador puede eliminar.' };
  const actual = await obtener(nombre, id);
  if (!actual || actual.eliminadoEn) return { ok: false, status: 404, error: 'Este elemento ya no existe.' };
  await env.DB.batch([
    env.DB.prepare(`UPDATE items SET eliminado_en = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(id),
    toD1(
      registro(usuario, {
        accion: 'eliminar',
        objetoTipo: 'item',
        objetoId: id,
        objetoNombre: tituloDe(nombre, actual.datos),
        contexto: nombre,
      }),
    ),
  ]);
  return { ok: true, id };
}

// ─── Papelera ──────────────────────────────────────────────────────────────

function limitePapelera() {
  return new Date(Date.now() - cliente.portal.diasPapelera * 86400_000).toISOString();
}

/** Borra definitivamente lo que lleva más de N días en la papelera. */
export async function purgarPapelera() {
  await env.DB.prepare('DELETE FROM items WHERE eliminado_en IS NOT NULL AND eliminado_en < ?').bind(limitePapelera()).run();
}

export async function papelera(): Promise<FilaItem[]> {
  await purgarPapelera();
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNAS} FROM items WHERE eliminado_en IS NOT NULL ORDER BY eliminado_en DESC`,
  ).all<FilaCruda>();
  return results.map(aItem);
}

export async function recuperar(usuario: UsuarioSesion, id: string): Promise<Resultado> {
  const f = await env.DB.prepare(`SELECT ${COLUMNAS} FROM items WHERE id = ? AND eliminado_en IS NOT NULL`).bind(id).first<FilaCruda>();
  if (!f) return { ok: false, status: 404, error: 'Ya no está en la papelera.' };
  const item = aItem(f);
  try {
    await env.DB.batch([
      // Vuelve como borrador para que nadie publique algo sin revisarlo.
      env.DB.prepare(
        `UPDATE items SET eliminado_en = NULL, estado = CASE WHEN estado = 'publicado' THEN 'borrador' ELSE estado END,
           actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      ).bind(id),
      toD1(
        registro(usuario, {
          accion: 'recuperar',
          objetoTipo: 'item',
          objetoId: id,
          objetoNombre: tituloDe(item.coleccion, item.datos),
          contexto: item.coleccion,
        }),
      ),
    ]);
  } catch (e) {
    return errorDeBase(e, item.coleccion);
  }
  return { ok: true, id };
}

export async function borrarDefinitivo(usuario: UsuarioSesion, id: string): Promise<Resultado> {
  if (usuario.rol !== 'admin') return { ok: false, status: 403, error: 'Solo un administrador puede borrar definitivamente.' };
  const f = await env.DB.prepare(`SELECT ${COLUMNAS} FROM items WHERE id = ? AND eliminado_en IS NOT NULL`).bind(id).first<FilaCruda>();
  if (!f) return { ok: false, status: 404, error: 'Ya no está en la papelera.' };
  const item = aItem(f);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id),
    toD1(
      registro(usuario, {
        accion: 'borrar',
        objetoTipo: 'item',
        objetoId: id,
        objetoNombre: tituloDe(item.coleccion, item.datos),
        contexto: item.coleccion,
      }),
    ),
  ]);
  return { ok: true, id };
}
