/**
 * Descripción de campos para generar formularios desde los esquemas Zod.
 *
 * Los esquemas de cada colección llevan metadatos de presentación con
 * `.meta({...})` (etiqueta en español, ayuda, tipo de control, proporción de
 * las fotos, relación con otra colección). `describirObjeto()` recorre el
 * esquema y devuelve una lista de campos que el portal sabe dibujar. Así el
 * portal no conoce ningún campo de ningún cliente.
 */
import { z } from 'zod';
import type { Proporcion } from './schema';

/** Controles que el portal sabe dibujar. */
export type Control =
  | 'texto'
  | 'textoLargo'
  | 'rico'
  | 'slug'
  | 'fecha'
  | 'url'
  | 'enlace'
  | 'numero'
  | 'opcion'
  | 'opciones'
  | 'listaTexto'
  | 'imagen'
  | 'galeria'
  | 'video_youtube'
  | 'videos_youtube'
  | 'relacion'
  | 'grupo';

export interface Relacion {
  /** Colección de la que se eligen valores. */
  coleccion: string;
  /** Campo que se guarda (p. ej. `slug`). */
  valor: string;
  /** Campo que se muestra (p. ej. `nombre`). */
  etiqueta: string;
}

declare module 'zod' {
  interface GlobalMeta {
    /** Nombre del campo en el portal, en lenguaje simple. */
    etiqueta?: string;
    /** Ayuda que aparece bajo el campo. */
    ayuda?: string;
    /** Fuerza un control distinto al que se deduce del tipo. */
    control?: Control;
    /** Fotos: proporción de recorte (p. ej. "16:9"). */
    proporcion?: Proporcion;
    /** Opciones con nombre legible: valor → etiqueta. */
    opciones?: Record<string, string>;
    /** Valor elegido de otra colección. */
    relacion?: Relacion;
    /** Slugs: campo del que se genera automáticamente (p. ej. `titulo`). */
    desde?: string;
    /** Texto enriquecido: límite de caracteres del texto total. */
    max?: number;
  }
}

export interface Campo {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  control: Control;
  obligatorio: boolean;
  /** Admite vacío (se guarda `null`). */
  anulable: boolean;
  max?: number;
  min?: number;
  proporcion?: Proporcion;
  opciones?: { valor: string; etiqueta: string }[];
  relacion?: Relacion;
  desde?: string;
  /** Solo `grupo`: campos internos. */
  campos?: Campo[];
  /** Solo `listaTexto`: límite de cada elemento. */
  maxElemento?: number;
}

type Cualquiera = z.ZodType;

interface Desenvuelto {
  base: Cualquiera;
  anulable: boolean;
  meta: z.GlobalMeta;
}

/** Quita nullable/optional/default y junta los metadatos de todas las capas. */
function desenvolver(schema: Cualquiera): Desenvuelto {
  let actual: Cualquiera = schema;
  let anulable = false;
  let meta: z.GlobalMeta = {};
  for (;;) {
    meta = { ...(actual.meta() ?? {}), ...meta };
    const tipo = actual._zod.def.type;
    if (tipo === 'nullable' || tipo === 'optional' || tipo === 'default') {
      anulable = anulable || tipo !== 'default';
      actual = (actual._zod.def as unknown as { innerType: Cualquiera }).innerType;
      continue;
    }
    break;
  }
  return { base: actual, anulable, meta };
}

function etiquetaDesdeNombre(nombre: string) {
  const conEspacios = nombre.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}

function opcionesDe(valores: readonly string[], nombres?: Record<string, string>) {
  return valores.map((valor) => ({ valor, etiqueta: nombres?.[valor] ?? etiquetaDesdeNombre(valor) }));
}

/** Describe un campo a partir de su esquema. */
export function describirCampo(nombre: string, schema: Cualquiera): Campo {
  const { base, anulable, meta } = desenvolver(schema);
  const tipo = base._zod.def.type;
  const campo: Campo = {
    nombre,
    etiqueta: meta.etiqueta ?? etiquetaDesdeNombre(nombre),
    ...(meta.ayuda ? { ayuda: meta.ayuda } : {}),
    control: 'texto',
    obligatorio: !anulable,
    anulable,
  };

  if (meta.proporcion !== undefined) campo.proporcion = meta.proporcion;
  if (meta.relacion) campo.relacion = meta.relacion;
  if (meta.desde) campo.desde = meta.desde;

  if (tipo === 'string') {
    const s = base as z.ZodString;
    if (s.maxLength !== null) campo.max = s.maxLength;
    if (s.minLength !== null) campo.min = s.minLength;
    campo.control =
      meta.control ??
      (meta.relacion ? 'relacion' : s.format === 'url' ? 'url' : (s.maxLength ?? 0) > 160 ? 'textoLargo' : 'texto');
    // Slugs y relaciones validan con expresión regular: son obligatorios si no admiten vacío.
    const conPatron = campo.control === 'slug' || campo.control === 'relacion';
    campo.obligatorio = !anulable && ((s.minLength ?? 0) > 0 || conPatron);
    return campo;
  }
  if (tipo === 'number') {
    campo.control = 'numero';
    return campo;
  }
  if (tipo === 'enum') {
    campo.control = 'opcion';
    campo.opciones = opcionesDe((base as z.ZodEnum).options as string[], meta.opciones);
    return campo;
  }
  if (tipo === 'object') {
    if (meta.control === 'imagen' || meta.control === 'video_youtube') {
      campo.control = meta.control;
      return campo;
    }
    campo.control = 'grupo';
    campo.campos = describirObjeto(base as z.ZodObject);
    campo.obligatorio = false;
    return campo;
  }
  if (tipo === 'array') {
    if (meta.control === 'rico') {
      campo.control = 'rico';
      if (typeof meta.max === 'number') campo.max = meta.max;
      campo.obligatorio = !anulable;
      return campo;
    }
    const elemento = desenvolver((base as z.ZodArray<Cualquiera>).element);
    const tipoElemento = elemento.base._zod.def.type;
    campo.obligatorio = false;
    if (elemento.meta.control === 'imagen') {
      campo.control = 'galeria';
      return campo;
    }
    if (elemento.meta.control === 'video_youtube') {
      campo.control = 'videos_youtube';
      const max = (base as z.ZodArray<Cualquiera>)._zod.bag.maximum;
      if (typeof max === 'number') campo.max = max;
      return campo;
    }
    if (tipoElemento === 'enum') {
      campo.control = 'opciones';
      campo.opciones = opcionesDe((elemento.base as z.ZodEnum).options as string[], meta.opciones);
      return campo;
    }
    if (tipoElemento === 'string') {
      campo.control = 'listaTexto';
      const max = (elemento.base as z.ZodString).maxLength;
      if (max !== null) campo.maxElemento = max;
      return campo;
    }
  }
  throw new Error(`Campo "${nombre}": tipo "${tipo}" no soportado por el portal`);
}

/** Campos propios de un objeto (sin los de la base de colección). */
export function describirObjeto(schema: z.ZodObject, omitir: readonly string[] = []): Campo[] {
  return Object.entries(schema.shape)
    .filter(([nombre]) => !omitir.includes(nombre))
    .map(([nombre, s]) => describirCampo(nombre, s as Cualquiera));
}

/** Campos base que el portal maneja por su cuenta (no se muestran en el formulario). */
export const CAMPOS_BASE = ['id', 'estado', 'orden', 'creado', 'actualizado'] as const;

/** Valor vacío para un campo nuevo. */
export function valorInicial(campo: Campo): unknown {
  switch (campo.control) {
    case 'galeria':
    case 'videos_youtube':
    case 'listaTexto':
    case 'opciones':
      return [];
    case 'rico':
      return campo.anulable ? null : [];
    case 'grupo':
      return Object.fromEntries((campo.campos ?? []).map((c) => [c.nombre, valorInicial(c)]));
    case 'opcion':
      return campo.anulable ? null : (campo.opciones?.[0]?.valor ?? '');
    default:
      return campo.anulable ? null : '';
  }
}

/**
 * Limpia los valores antes de validar: quita espacios sobrantes y convierte
 * los textos vacíos en `null` cuando el campo lo admite (así el sitio los
 * trata como "pendiente" y no muestra un texto vacío).
 */
export function normalizarValores(campos: Campo[], datos: Record<string, unknown>): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  for (const c of campos) {
    let v = datos[c.nombre];
    if (typeof v === 'string') {
      v = c.control === 'textoLargo' ? v.replace(/\s+$/g, '').replace(/^\s+/g, '') : v.trim();
      if (v === '' && c.anulable) v = null;
    } else if (c.control === 'grupo' && v && typeof v === 'object' && !Array.isArray(v)) {
      v = normalizarValores(c.campos ?? [], v as Record<string, unknown>);
    } else if (c.control === 'listaTexto' && Array.isArray(v)) {
      v = v.map((x) => (typeof x === 'string' ? x.trim() : x)).filter((x) => x !== '');
    } else if (v === undefined) {
      v = c.anulable ? null : valorInicial(c);
    }
    salida[c.nombre] = v;
  }
  return salida;
}
