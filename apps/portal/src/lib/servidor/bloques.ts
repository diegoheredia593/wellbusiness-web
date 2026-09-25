/**
 * Bloques fijos: lectura agrupada por página y sección, y guardado validado.
 * Las definiciones (etiquetas, tipo, límites, nivel) vienen de la
 * configuración del cliente; de la base solo se toman los valores.
 */
import { env } from 'cloudflare:workers';
import cliente from '@cliente';
import {
  imagenSchema,
  textoEnriquecidoSchema,
  validarBloque,
  type DefinicionBloque,
  type NivelBloque,
} from '@cms/core/schema';
import { mensajesEnEspanol } from '@cms/core/validacion';
import { registro } from './auditoria';
import { db, toD1 } from './db';
import type { UsuarioSesion } from './tipos';

export interface BloqueEditable {
  key: string;
  campo: string;
  tipo: DefinicionBloque['tipo'];
  maxLength: number | null;
  obligatorio: boolean;
  ayuda?: string;
  proporcion?: DefinicionBloque['proporcion'];
  valor: unknown;
  /** Cambio pendiente de aprobación (modo "requiere aprobación"). */
  borrador: unknown;
  actualizado: string | null;
}

export interface SeccionEditable {
  id: string;
  etiqueta: string;
  bloques: BloqueEditable[];
}

interface Fila {
  key: string;
  valor: string | null;
  valor_borrador: string | null;
  actualizado: string;
}

const definiciones = new Map(cliente.bloques.map((b) => [b.key, b]));

export function etiquetaPagina(pagina: string) {
  return cliente.etiquetas.paginas[pagina] ?? pagina;
}

/** Páginas en el orden de la configuración, con los bloques del nivel pedido. */
export function paginasDeNivel(nivel: NivelBloque) {
  const orden: string[] = [];
  for (const b of cliente.bloques) {
    if (b.nivel === nivel && !orden.includes(b.pagina)) orden.push(b.pagina);
  }
  return orden;
}

async function filas(): Promise<Map<string, Fila>> {
  const { results } = await env.DB.prepare('SELECT key, valor, valor_borrador, actualizado FROM bloques').all<Fila>();
  return new Map(results.map((r) => [r.key, r]));
}

const leer = (t: string | null) => (t === null ? null : (JSON.parse(t) as unknown));

/** Resumen por página: cuántos campos tiene y cuántos están vacíos. */
export async function resumenPaginas(nivel: NivelBloque) {
  const valores = await filas();
  return paginasDeNivel(nivel).map((pagina) => {
    const bloques = cliente.bloques.filter((b) => b.pagina === pagina && b.nivel === nivel);
    const vacios = bloques.filter((b) => {
      const v = leer(valores.get(b.key)?.valor ?? null);
      return v === null || v === '' || (Array.isArray(v) && v.length === 0);
    }).length;
    const pendientes = bloques.filter((b) => valores.get(b.key)?.valor_borrador != null).length;
    return { pagina, etiqueta: etiquetaPagina(pagina), campos: bloques.length, vacios, pendientes };
  });
}

/** Secciones y campos de una página, en el orden de la configuración. */
export async function seccionesDePagina(pagina: string, nivel: NivelBloque): Promise<SeccionEditable[]> {
  const valores = await filas();
  const secciones: SeccionEditable[] = [];
  for (const b of cliente.bloques) {
    if (b.pagina !== pagina || b.nivel !== nivel) continue;
    const id = `${b.pagina}.${b.seccion}`;
    let s = secciones.find((x) => x.id === id);
    if (!s) {
      s = { id, etiqueta: cliente.etiquetas.secciones[id] ?? b.seccion, bloques: [] };
      secciones.push(s);
    }
    const fila = valores.get(b.key);
    s.bloques.push({
      key: b.key,
      campo: b.campo,
      tipo: b.tipo,
      maxLength: b.maxLength,
      obligatorio: b.obligatorio,
      ...(b.ayuda ? { ayuda: b.ayuda } : {}),
      ...(b.tipo === 'imagen' ? { proporcion: b.proporcion ?? null } : {}),
      valor: fila ? leer(fila.valor) : b.valor,
      borrador: fila ? leer(fila.valor_borrador) : null,
      actualizado: fila?.actualizado ?? null,
    });
  }
  return secciones;
}

/** Limpia el valor según el tipo: espacios y vacíos → null. */
function normalizar(def: DefinicionBloque, valor: unknown): unknown {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string') {
    const t = valor.trim();
    return t === '' ? null : t;
  }
  if (Array.isArray(valor) && valor.length === 0) return null;
  if (def.tipo === 'texto_enriquecido') return textoEnriquecidoSchema.parse(valor);
  if (def.tipo === 'imagen') return imagenSchema.parse(valor);
  return valor;
}

export type ResultadoGuardado =
  | { ok: true; guardados: number; modo: 'publicado' | 'revision' }
  | { ok: false; status: number; error: string; campos?: Record<string, string> };

/**
 * Guarda varios bloques de una página.
 * - Un editor no puede tocar bloques de nivel `sistema`.
 * - En modo "requiere aprobación", lo que guarda un editor queda en revisión.
 * - Todo se escribe en una sola consulta (límite de consultas del plan gratis).
 */
export async function guardarBloques(
  usuario: UsuarioSesion,
  pagina: string,
  cambios: Record<string, unknown>,
): Promise<ResultadoGuardado> {
  mensajesEnEspanol();
  const campos: Record<string, string> = {};
  const filasNuevas: { key: string; valor: unknown }[] = [];

  for (const [key, crudo] of Object.entries(cambios)) {
    const def = definiciones.get(key);
    if (!def || def.pagina !== pagina) return { ok: false, status: 400, error: 'Hay un campo que no pertenece a esta página.' };
    if (def.nivel === 'sistema' && usuario.rol !== 'admin') {
      return { ok: false, status: 403, error: 'Ese texto solo lo puede cambiar un administrador.' };
    }
    let valor: unknown;
    try {
      valor = normalizar(def, crudo);
    } catch {
      campos[key] = def.tipo === 'imagen' ? 'La foto necesita su texto alternativo.' : 'El contenido no es válido.';
      continue;
    }
    const problemas = validarBloque({ ...def, valor } as DefinicionBloque);
    if (problemas.length) {
      campos[key] = problemas[0]!.replace(`${key}: `, '').replace(/^es obligatorio y está vacío$/, 'Este campo es obligatorio.')
        .replace(/^(\d+) caracteres \(máx\. (\d+)\)$/, 'Tiene $1 caracteres; el máximo es $2.')
        .replace(/^URL no válida$/, 'Escribe una página del sitio (/…), una dirección https://, mailto: o tel:.');
      continue;
    }
    filasNuevas.push({ key, valor });
  }
  if (Object.keys(campos).length) return { ok: false, status: 422, error: 'Revisa los campos marcados.', campos };
  if (!filasNuevas.length) return { ok: true, guardados: 0, modo: 'publicado' };

  const revision = cliente.portal.requiereAprobacion && usuario.rol !== 'admin';
  const columna = revision ? 'valor_borrador' : 'valor';
  const datos = JSON.stringify(filasNuevas.map((f) => ({ key: f.key, valor: f.valor === null ? null : JSON.stringify(f.valor) })));
  const nombres = filasNuevas.map((f) => definiciones.get(f.key)!.campo);

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE bloques SET ${columna} = j.value ->> '$.valor',
         ${revision ? '' : 'valor_borrador = NULL,'}
         actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), actualizado_por = ?
       FROM json_each(?) AS j WHERE bloques.key = j.value ->> '$.key'`,
    ).bind(usuario.id, datos),
    toD1(
      registro(usuario, {
        accion: revision ? 'enviar_revision' : 'editar',
        objetoTipo: 'bloque',
        contexto: pagina,
        resumen: resumirCampos(pagina, filasNuevas.map((f) => f.key), nombres),
      }),
    ),
  ]);

  return { ok: true, guardados: filasNuevas.length, modo: revision ? 'revision' : 'publicado' };
}

/** "Hero: Título, Texto" — las secciones y campos cambiados, para el historial. */
function resumirCampos(pagina: string, keys: string[], nombres: string[]) {
  const porSeccion = new Map<string, string[]>();
  keys.forEach((k, i) => {
    const def = definiciones.get(k)!;
    const s = cliente.etiquetas.secciones[`${pagina}.${def.seccion}`] ?? def.seccion;
    if (!porSeccion.has(s)) porSeccion.set(s, []);
    porSeccion.get(s)!.push(nombres[i]!);
  });
  return [...porSeccion].map(([s, c]) => `${s}: ${c.join(', ')}`).join(' · ');
}


/** Aprueba (o descarta) los cambios en revisión de una página. Solo admins. */
export async function resolverRevisionPagina(usuario: UsuarioSesion, pagina: string, aprobar: boolean) {
  const keys = cliente.bloques.filter((b) => b.pagina === pagina).map((b) => b.key);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE bloques SET ${aprobar ? 'valor = valor_borrador,' : ''} valor_borrador = NULL,
         actualizado = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), actualizado_por = ?
       WHERE valor_borrador IS NOT NULL AND key IN (SELECT value FROM json_each(?))`,
    ).bind(usuario.id, JSON.stringify(keys)),
    toD1(registro(usuario, { accion: aprobar ? 'aprobar' : 'descartar', objetoTipo: 'bloque', contexto: pagina })),
  ]);
}

export { db };
