/**
 * Validación de ítems de colecciones y mensajes de error en español simple.
 *
 * - Publicar exige el ítem completo y válido.
 * - Un borrador puede estar incompleto: solo se validan los campos que ya
 *   tienen algo escrito (formato y límites).
 */
import { z } from 'zod';
import { CAMPOS_BASE } from './campos';
import type { DefinicionColeccion } from './schema';

let configurado = false;

/** Mensajes de Zod en español, para todo el proceso. Seguro de llamar varias veces. */
export function mensajesEnEspanol() {
  if (configurado) return;
  configurado = true;
  z.config({
    customError: (iss) => {
      switch (iss.code) {
        case 'too_small':
          if (iss.origin === 'string') return Number(iss.minimum) <= 1 ? 'Este campo es obligatorio.' : `Mínimo ${iss.minimum} caracteres.`;
          if (iss.origin === 'array') return `Agrega al menos ${iss.minimum}.`;
          return 'Valor demasiado pequeño.';
        case 'too_big':
          if (iss.origin === 'string') return `Máximo ${iss.maximum} caracteres.`;
          if (iss.origin === 'array') return `Máximo ${iss.maximum} elementos.`;
          return 'Valor demasiado grande.';
        case 'invalid_type':
          return iss.input === null || iss.input === undefined || iss.input === ''
            ? 'Este campo es obligatorio.'
            : 'El valor no es válido.';
        case 'invalid_format':
          if (iss.format === 'url') return 'Escribe una dirección completa que empiece con https://';
          if (iss.format === 'email') return 'Escribe un correo válido.';
          return 'El formato no es válido.';
        case 'invalid_value':
          return 'Elige una de las opciones.';
        default:
          return 'El valor no es válido.';
      }
    },
  });
}

export type Errores = Record<string, string>;

export type ResultadoValidacion =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; errores: Errores };

function vacio(v: unknown) {
  return (
    v === null ||
    v === undefined ||
    (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0)
  );
}

function juntarErrores(error: z.ZodError, prefijo: string[] = []): Errores {
  const errores: Errores = {};
  for (const issue of error.issues) {
    const clave = [...prefijo, ...issue.path.map(String)].join('.') || '_';
    errores[clave] ??= issue.message;
  }
  return errores;
}

/** Quita los campos base y deja solo los datos propios del ítem. */
function soloDatos(obj: Record<string, unknown>) {
  const copia = { ...obj };
  for (const k of CAMPOS_BASE) delete copia[k];
  return copia;
}

const BASE_FICTICIA = {
  id: 'validacion',
  estado: 'publicado' as const,
  orden: 0,
  creado: '2000-01-01T00:00:00.000Z',
  actualizado: '2000-01-01T00:00:00.000Z',
};

/** Validación completa (para publicar o guardar un ítem publicado). */
export function validarCompleto(def: DefinicionColeccion, datos: Record<string, unknown>): ResultadoValidacion {
  mensajesEnEspanol();
  const r = def.schema.safeParse({ ...datos, ...BASE_FICTICIA });
  if (!r.success) return { ok: false, errores: juntarErrores(r.error) };
  return { ok: true, datos: soloDatos(r.data as Record<string, unknown>) };
}

/**
 * Validación de borrador: los campos vacíos se aceptan (se guardan como
 * vacíos); los que tienen valor deben cumplir su formato y límites.
 */
export function validarBorrador(def: DefinicionColeccion, datos: Record<string, unknown>): ResultadoValidacion {
  mensajesEnEspanol();
  const errores: Errores = {};
  const limpio: Record<string, unknown> = {};
  for (const [campo, esquema] of Object.entries(def.schema.shape)) {
    if ((CAMPOS_BASE as readonly string[]).includes(campo)) continue;
    const valor = datos[campo];
    if (vacio(valor)) {
      limpio[campo] = valor ?? null;
      continue;
    }
    const r = (esquema as z.ZodType).safeParse(valor);
    if (r.success) limpio[campo] = r.data;
    else Object.assign(errores, juntarErrores(r.error, [campo]));
  }
  return Object.keys(errores).length ? { ok: false, errores } : { ok: true, datos: limpio };
}
