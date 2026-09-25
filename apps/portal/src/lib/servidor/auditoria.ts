/**
 * Historial de cambios. Cada acción queda registrada con quién, qué, sobre
 * qué y cuándo; `describirEvento` la convierte en una frase legible
 * ("María archivó la noticia «Canastas navideñas» el 3 de octubre").
 */
import { desc, lt } from 'drizzle-orm';
import cliente from '@cliente';
import { db, esquema } from './db';
import type { UsuarioSesion } from './tipos';
import { conArticulo, formatearFechaHora } from '../textos';

const { auditoria } = esquema;

export type Accion =
  | 'crear'
  | 'editar'
  | 'publicar'
  | 'despublicar'
  | 'archivar'
  | 'restaurar'
  | 'eliminar'
  | 'borrar'
  | 'recuperar'
  | 'reordenar'
  | 'enviar_revision'
  | 'aprobar'
  | 'descartar'
  | 'subir_foto'
  | 'editar_foto'
  | 'borrar_foto'
  | 'invitar'
  | 'unirse'
  | 'activar'
  | 'desactivar'
  | 'cambiar_rol'
  | 'enlace_restablecer'
  | 'restablecer'
  | 'configurar'
  | 'carga_inicial'
  | 'leer_envio'
  | 'borrar_envio';

export type TipoObjeto = 'bloque' | 'item' | 'medio' | 'usuario' | 'envio' | 'portal';

export interface Evento {
  accion: Accion;
  objetoTipo: TipoObjeto;
  objetoId?: string | null;
  objetoNombre?: string | null;
  /** Colección (items), página (bloques) o tipo de formulario (envíos). */
  contexto?: string | null;
  resumen?: string | null;
}

/** Consulta de inserción, para incluirla en un batch junto al cambio. */
export function registro(usuario: Pick<UsuarioSesion, 'id' | 'nombre'> | null, e: Evento) {
  return db()
    .insert(auditoria)
    .values({
      usuarioId: usuario?.id ?? null,
      usuarioNombre: usuario?.nombre ?? 'Sistema',
      accion: e.accion,
      objetoTipo: e.objetoTipo,
      objetoId: e.objetoId ?? null,
      objetoNombre: e.objetoNombre ?? null,
      contexto: e.contexto ?? null,
      resumen: e.resumen?.slice(0, 500) ?? null,
    });
}

export async function registrar(usuario: Pick<UsuarioSesion, 'id' | 'nombre'> | null, e: Evento) {
  await registro(usuario, e);
}

export async function ultimosEventos(limite = 20, antesDe?: number) {
  const q = db().select().from(auditoria);
  return (antesDe ? q.where(lt(auditoria.id, antesDe)) : q).orderBy(desc(auditoria.id)).limit(limite).all();
}

const VERBOS: Record<Accion, string> = {
  crear: 'creó',
  editar: 'editó',
  publicar: 'publicó',
  despublicar: 'pasó a borrador',
  archivar: 'archivó',
  restaurar: 'restauró',
  eliminar: 'mandó a la papelera',
  borrar: 'borró definitivamente',
  recuperar: 'recuperó de la papelera',
  reordenar: 'reordenó',
  enviar_revision: 'envió a revisión',
  aprobar: 'aprobó los cambios de',
  descartar: 'descartó los cambios de',
  subir_foto: 'subió la foto',
  editar_foto: 'editó la foto',
  borrar_foto: 'borró la foto',
  invitar: 'invitó a',
  unirse: 'se unió al portal',
  activar: 'activó a',
  desactivar: 'desactivó a',
  cambiar_rol: 'cambió el rol de',
  enlace_restablecer: 'generó un enlace para restablecer la contraseña de',
  restablecer: 'cambió su contraseña',
  configurar: 'configuró el portal',
  carga_inicial: 'cargó el contenido inicial',
  leer_envio: 'marcó como leído un envío de',
  borrar_envio: 'borró un envío de',
};

/** Frase legible del evento, sin la fecha. */
export function describirEvento(e: typeof auditoria.$inferSelect): string {
  const quien = e.usuarioNombre;
  const verbo = VERBOS[e.accion as Accion] ?? e.accion;
  const nombre = e.objetoNombre ? `«${e.objetoNombre}»` : '';

  if (e.objetoTipo === 'item' && e.contexto) {
    const col = cliente.colecciones[e.contexto];
    const que = col ? conArticulo(col) : 'el elemento';
    if (e.accion === 'reordenar') return `${quien} reordenó ${col?.etiqueta.toLowerCase() ?? 'la lista'}`;
    return `${quien} ${verbo} ${que} ${nombre}`.trim();
  }
  if (e.objetoTipo === 'bloque') {
    const pagina = e.contexto ? (cliente.etiquetas.paginas[e.contexto] ?? e.contexto) : '';
    const campos = e.resumen ? ` (${e.resumen})` : '';
    if (e.accion === 'editar') return `${quien} editó textos de la página ${pagina}${campos}`;
    return `${quien} ${verbo} textos de la página ${pagina}${campos}`;
  }
  if (e.objetoTipo === 'envio') {
    const form = e.contexto ? (cliente.formularios[e.contexto]?.etiqueta ?? e.contexto) : '';
    return `${quien} ${verbo} ${form}`;
  }
  if (e.objetoTipo === 'medio') return `${quien} ${verbo} ${nombre}`.trim();
  if (e.objetoTipo === 'usuario') {
    if (e.accion === 'restablecer' || e.accion === 'unirse') return `${quien} ${verbo}`;
    const extra = e.resumen ? ` (${e.resumen})` : '';
    return `${quien} ${verbo} ${e.objetoNombre ?? ''}${extra}`.trim();
  }
  return `${quien} ${verbo}`;
}

/** Frase completa con fecha. */
export function fraseEvento(e: typeof auditoria.$inferSelect) {
  return `${describirEvento(e)} el ${formatearFechaHora(e.creado, cliente.portal.zonaHoraria)}`;
}
