/**
 * Carga inicial: pasa el contenido de `clientes/<cliente>/` a la base.
 *
 * - Los textos (bloques) se cargan solos al arrancar el portal (sincronización).
 * - Esta carga pasa los elementos de las colecciones y los envíos de ejemplo.
 * - Las fotos de relleno de la fase 1 (/placeholders/…) se omiten: no son fotos
 *   reales y el portal no las tiene.
 * - Todo en pocas consultas (json_each) para respetar el límite del plan gratis.
 */
import { env } from 'cloudflare:workers';
import { inArray } from 'drizzle-orm';
import cliente from '@cliente';
import { validarBorrador, validarCompleto } from '@cms/core/validacion';
import { CAMPOS_BASE } from '@cms/core/campos';
import { registro } from './auditoria';
import { db, esquema, toD1 } from './db';
import { definicion } from './items';
import type { UsuarioSesion } from './tipos';

const esRelleno = (v: unknown) =>
  !!v && typeof v === 'object' && typeof (v as { src?: unknown }).src === 'string' && (v as { src: string }).src.startsWith('/placeholders/');

/** Quita las fotos de relleno de cualquier campo (foto sola o galería). */
function sinRelleno(datos: Record<string, unknown>) {
  const salida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(datos)) {
    if (esRelleno(v)) salida[k] = null;
    else if (Array.isArray(v)) salida[k] = v.filter((x) => !esRelleno(x));
    else salida[k] = v;
  }
  return salida;
}

export async function estadoCarga() {
  const [items, envios, bloques] = await env.DB.batch<{ n: number }>([
    env.DB.prepare('SELECT count(*) AS n FROM items'),
    env.DB.prepare('SELECT count(*) AS n FROM envios_formulario WHERE es_ejemplo = 1'),
    env.DB.prepare('SELECT count(*) AS n FROM bloques'),
  ]);
  return {
    items: items?.results[0]?.n ?? 0,
    enviosEjemplo: envios?.results[0]?.n ?? 0,
    bloques: bloques?.results[0]?.n ?? 0,
    disponibles: Object.values(cliente.contenidoInicial.colecciones).reduce((n, l) => n + l.length, 0),
  };
}

/** Recolecta todo id de `medio` (foto de la biblioteca) referenciado dentro de un valor validado. */
function mediosReferenciados(valor: unknown, encontrados: Map<string, string[]>, contexto: string) {
  if (Array.isArray(valor)) {
    for (const v of valor) mediosReferenciados(v, encontrados, contexto);
    return;
  }
  if (valor && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    if (typeof obj.medio === 'string' && obj.medio) {
      const usos = encontrados.get(obj.medio) ?? [];
      if (!usos.includes(contexto)) usos.push(contexto);
      encontrados.set(obj.medio, usos);
    }
    for (const v of Object.values(obj)) mediosReferenciados(v, encontrados, contexto);
  }
}

/**
 * De los ids de `medio` que el contenido dice usar, cuáles no existen en la
 * tabla `medios` — evita crear ítems con fotos rotas si `medios-generados.ts`
 * quedó desactualizado (por ejemplo, un id de una corrida local de prueba
 * que nunca se subió al portal real).
 */
async function idsDeMedioFaltantes(ids: Iterable<string>): Promise<Set<string>> {
  const lista = [...new Set(ids)];
  if (lista.length === 0) return new Set();
  const filas = await db().select({ id: esquema.medios.id }).from(esquema.medios).where(inArray(esquema.medios.id, lista)).all();
  const existentes = new Set(filas.map((f) => f.id));
  return new Set(lista.filter((id) => !existentes.has(id)));
}

export async function cargarColecciones(usuario: UsuarioSesion, reemplazar: boolean) {
  const filas: Record<string, unknown>[] = [];
  const problemas: string[] = [];
  const mediosUsados = new Map<string, string[]>();
  for (const [nombre, lista] of Object.entries(cliente.contenidoInicial.colecciones)) {
    const def = definicion(nombre);
    if (!def) {
      problemas.push(`La colección "${nombre}" no está definida.`);
      continue;
    }
    for (const crudo of lista as Record<string, unknown>[]) {
      const datos = sinRelleno(
        Object.fromEntries(Object.entries(crudo).filter(([k]) => !(CAMPOS_BASE as readonly string[]).includes(k))),
      );
      const estado = String(crudo.estado ?? 'publicado');
      const v = estado === 'borrador' ? validarBorrador(def, datos) : validarCompleto(def, datos);
      if (!v.ok) {
        problemas.push(`${def.etiqueta} · ${String(crudo.id)}: ${Object.entries(v.errores).map(([c, m]) => `${c}: ${m}`).join('; ')}`);
        continue;
      }
      mediosReferenciados(v.datos, mediosUsados, `${def.etiqueta} · ${String(crudo.id)}`);
      const slug = def.campoSlug ? (v.datos[def.campoSlug] as string | null) : null;
      filas.push({
        id: String(crudo.id),
        coleccion: nombre,
        slug: slug || null,
        estado,
        orden: Number(crudo.orden ?? 0),
        datos: JSON.stringify(v.datos),
        creado: String(crudo.creado ?? new Date().toISOString()),
        actualizado: String(crudo.actualizado ?? new Date().toISOString()),
      });
    }
  }
  if (problemas.length) return { ok: false as const, problemas };

  const faltantes = await idsDeMedioFaltantes(mediosUsados.keys());
  if (faltantes.size) {
    for (const id of faltantes) {
      problemas.push(`Falta la foto "${id}" en la biblioteca de medios (usada en: ${mediosUsados.get(id)!.join(', ')}).`);
    }
    problemas.push(
      'Corre scripts/importar-fotos.ts contra este portal, confirma que clientes/<cliente>/src/medios-generados.ts quedó actualizado y vuelve a desplegar antes de cargar el contenido inicial.',
    );
    return { ok: false as const, problemas };
  }

  await env.DB.batch([
    ...(reemplazar ? [env.DB.prepare('DELETE FROM items')] : []),
    env.DB.prepare(
      `INSERT INTO items (id, coleccion, slug, estado, orden, datos, creado, actualizado, autor)
       SELECT j.value ->> '$.id', j.value ->> '$.coleccion', j.value ->> '$.slug', j.value ->> '$.estado',
              j.value ->> '$.orden', j.value ->> '$.datos', j.value ->> '$.creado', j.value ->> '$.actualizado', ?
       FROM json_each(?) AS j WHERE true
       ON CONFLICT(id) DO NOTHING`,
    ).bind(usuario.id, JSON.stringify(filas)),
    toD1(registro(usuario, { accion: 'carga_inicial', objetoTipo: 'portal', resumen: `${filas.length} elementos` })),
  ]);
  return { ok: true as const, cargados: filas.length };
}

export async function cargarEnviosEjemplo() {
  const filas = cliente.contenidoInicial.enviosEjemplo.map((e) => ({
    id: crypto.randomUUID(),
    tipo: e.tipo,
    datos: JSON.stringify(e.datos),
    creado: e.creado,
  }));
  await env.DB.prepare(
    `INSERT INTO envios_formulario (id, tipo, datos, creado, es_ejemplo)
     SELECT j.value ->> '$.id', j.value ->> '$.tipo', j.value ->> '$.datos', j.value ->> '$.creado', 1
     FROM json_each(?) AS j`,
  )
    .bind(JSON.stringify(filas))
    .run();
  return filas.length;
}

export async function borrarEnviosEjemplo() {
  await env.DB.prepare('DELETE FROM envios_formulario WHERE es_ejemplo = 1').run();
}
