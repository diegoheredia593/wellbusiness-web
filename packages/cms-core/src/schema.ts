/**
 * Núcleo genérico del CMS (independiente de Fluvida).
 *
 * Dos tipos de contenido:
 *  - Bloques fijos: textos/valores de secciones que siempre existen. El portal
 *    solo edita su valor; no los crea ni los borra.
 *  - Colecciones: listas de ítems que se agregan, archivan y eliminan. Todo
 *    ítem comparte la misma base (id, estado, orden, fechas).
 *
 * Los esquemas están pensados para traducirse casi 1 a 1 a tablas SQL (D1):
 *   bloques(key PK, pagina, seccion, etiqueta, tipo, max_length, obligatorio, valor JSON)
 *   <coleccion>(id PK, estado, orden, creado, actualizado, ...campos)
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------

export const imagenSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'Toda imagen necesita texto alternativo (alt).'),
  ancho: z.number().int().positive(),
  alto: z.number().int().positive(),
  /** Id de la foto en la biblioteca del portal (si se subió desde ahí). */
  medio: z.string().optional(),
}).meta({ control: 'imagen' });
export type Imagen = z.infer<typeof imagenSchema>;

// ---------------------------------------------------------------------------
// Videos de YouTube (solo se guarda el id; el video vive en YouTube)
// ---------------------------------------------------------------------------

export const videoYoutubeSchema = z
  .object({
    id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{11}$/, 'Ese enlace no es de un video de YouTube. Copia el enlace desde el botón Compartir del video.'),
    /** Título accesible del reproductor (lo que anuncia un lector de pantalla). */
    titulo: z.string().trim().min(3, 'Escribe el título del video (al menos 3 caracteres).').max(120),
  })
  .meta({ control: 'video_youtube' });
export type VideoYoutube = z.infer<typeof videoYoutubeSchema>;

// ---------------------------------------------------------------------------
// Texto enriquecido (formato estructurado; nunca HTML arbitrario)
// ---------------------------------------------------------------------------

export const inlineSchema = z.object({
  texto: z.string(),
  negrita: z.boolean().optional(),
  cursiva: z.boolean().optional(),
  /** Solo rutas internas (/...), https:, mailto: o tel:. */
  enlace: z
    .string()
    .regex(/^(\/|https:\/\/|mailto:|tel:)/, 'Enlace no permitido')
    .optional(),
});
export type Inline = z.infer<typeof inlineSchema>;

export const nodoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('parrafo'), contenido: z.array(inlineSchema) }),
  z.object({
    tipo: z.literal('lista'),
    ordenada: z.boolean().default(false),
    items: z.array(z.array(inlineSchema)),
  }),
]);
export type Nodo = z.infer<typeof nodoSchema>;

export const textoEnriquecidoSchema = z.array(nodoSchema).meta({ control: 'rico' });
export type TextoEnriquecido = z.infer<typeof textoEnriquecidoSchema>;

// ---------------------------------------------------------------------------
// Bloques fijos
// ---------------------------------------------------------------------------

export const tiposBloque = ['texto', 'texto_largo', 'texto_enriquecido', 'url', 'imagen'] as const;
export type TipoBloque = (typeof tiposBloque)[number];

/**
 * Nivel de un bloque:
 *  - `contenido`: lo que un editor del portal puede cambiar (títulos, párrafos,
 *    botones visibles, datos de contacto y donación, cifras, metas SEO).
 *  - `sistema`: textos de accesibilidad, mensajes de validación, etiquetas de
 *    campos, textos de interfaz y bloques técnicos. Solo los ve un admin.
 */
export const nivelesBloque = ['contenido', 'sistema'] as const;
export type NivelBloque = (typeof nivelesBloque)[number];

/** Proporción de recorte de una imagen, p. ej. "4:5". `null` = libre. */
export type Proporcion = `${number}:${number}` | null;

/** Valor de un bloque según su tipo. `null` = vacío / pendiente. */
export type ValorBloque<T extends TipoBloque> = T extends 'texto_enriquecido'
  ? TextoEnriquecido | null
  : T extends 'imagen'
    ? Imagen | null
    : string | null;

export interface DefinicionBloque<T extends TipoBloque = TipoBloque> {
  /** Clave única: `pagina.seccion.campo` (p. ej. `inicio.hero.titulo`). */
  key: string;
  pagina: string;
  seccion: string;
  /** Etiqueta legible para el portal, p. ej. "Inicio → Hero → Título". */
  etiqueta: string;
  /** Solo el nombre del campo, p. ej. "Título". */
  campo: string;
  tipo: T;
  nivel: NivelBloque;
  /** Ayuda opcional que el portal muestra bajo el campo. */
  ayuda?: string;
  /** Solo imágenes: proporción a la que el portal recorta la foto. */
  proporcion?: Proporcion;
  /** Límite de caracteres (texto, texto_largo, url; en enriquecido, texto total). */
  maxLength: number | null;
  obligatorio: boolean;
  valor: ValorBloque<T>;
}

export function textoPlano(valor: TextoEnriquecido): string {
  return valor
    .flatMap((n) => (n.tipo === 'parrafo' ? [n.contenido] : n.items))
    .flatMap((inlines) => inlines.map((i) => i.texto))
    .join(' ');
}

/** Valida un bloque contra su definición. Devuelve la lista de problemas. */
export function validarBloque(b: DefinicionBloque): string[] {
  const errores: string[] = [];
  const vacio =
    b.valor === null ||
    (typeof b.valor === 'string' && b.valor.trim() === '') ||
    (Array.isArray(b.valor) && b.valor.length === 0);

  if (vacio) {
    if (b.obligatorio) errores.push(`${b.key}: es obligatorio y está vacío`);
    return errores;
  }
  if (b.tipo === 'imagen') {
    const r = imagenSchema.safeParse(b.valor);
    if (!r.success) errores.push(`${b.key}: imagen inválida (${r.error.issues[0]?.message})`);
    return errores;
  }
  if (b.tipo === 'texto_enriquecido') {
    const r = textoEnriquecidoSchema.safeParse(b.valor);
    if (!r.success) {
      errores.push(`${b.key}: texto enriquecido inválido`);
      return errores;
    }
    const largo = textoPlano(r.data).length;
    if (b.maxLength && largo > b.maxLength) errores.push(`${b.key}: ${largo} caracteres (máx. ${b.maxLength})`);
    return errores;
  }
  const texto = b.valor as string;
  if (b.maxLength && texto.length > b.maxLength) {
    errores.push(`${b.key}: ${texto.length} caracteres (máx. ${b.maxLength})`);
  }
  if (b.tipo === 'url' && !/^(\/|https:\/\/|mailto:|tel:|#)/.test(texto)) {
    errores.push(`${b.key}: URL no válida`);
  }
  return errores;
}

// ---------------------------------------------------------------------------
// Colecciones
// ---------------------------------------------------------------------------

export const estadosItem = ['borrador', 'publicado', 'archivado'] as const;
export type EstadoItem = (typeof estadosItem)[number];

export const itemBaseSchema = z.object({
  id: z.string().min(1),
  estado: z.enum(estadosItem),
  orden: z.number().int(),
  /** ISO 8601 */
  creado: z.string(),
  /** ISO 8601 */
  actualizado: z.string(),
});
export type ItemBase = z.infer<typeof itemBaseSchema>;

/** Construye el esquema de una colección a partir de sus campos propios. */
export function definirColeccion<S extends z.ZodRawShape>(campos: S) {
  return itemBaseSchema.extend(campos);
}

/** Una colección tal como la declara un cliente. */
export interface DefinicionColeccion<S extends z.ZodObject = z.ZodObject> {
  schema: S;
  /** Nombre legible en plural, p. ej. "Noticias". */
  etiqueta: string;
  /** Nombre legible en singular, p. ej. "noticia". */
  singular: string;
  /** Género gramatical del singular, para textos como "Nueva noticia". */
  genero: 'f' | 'm';
  /** Descripción corta para el portal. */
  descripcion: string;
  /** Campo que se usa como título del ítem en listas e historial. */
  campoTitulo: string;
  /** Campos en los que busca el buscador del portal. */
  busqueda?: string[];
  /**
   * Cómo ordena el sitio: `orden` (manual, se puede arrastrar) o por un campo
   * de fecha descendente (p. ej. noticias). Por defecto `orden`.
   */
  ordenarPor?: 'orden' | { campo: string };
  /** Campo único que forma la dirección de la página (p. ej. `slug`). */
  campoSlug?: string;
  /** Grupo del menú del portal (p. ej. "Carrera 10K"). */
  grupo?: string;
}

export function soloPublicados<T extends ItemBase>(items: T[]): T[] {
  return items.filter((i) => i.estado === 'publicado').sort((a, b) => a.orden - b.orden);
}
