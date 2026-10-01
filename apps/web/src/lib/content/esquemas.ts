/**
 * Forma de los ítems que devuelve la plataforma (`GET /v1/colecciones/<modulo>`), validada
 * **por ítem** en `./index.ts`: un ítem con datos raros se omite, nunca tumba la página.
 *
 * Son deliberadamente permisivos con los textos (sin largos máximos): la plataforma ya validó
 * el contenido al guardarlo; aquí solo interesa que la FORMA sea la que los componentes esperan.
 * Los ítems ya llegan filtrados (solo públicos) y ordenados por `orden`.
 */
import { z } from 'zod';

const base = {
  id: z.string(),
  slug: z.string().nullable(),
  orden: z.number(),
};

/** Foto tal como la sirve la plataforma (`src` absoluto). */
export const fotoSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number(),
  height: z.number(),
  /** Tamaños de foto (sprint 6a): ausente en respuestas viejas de la plataforma. */
  variantes: z.array(z.object({ src: z.string().min(1), width: z.number(), height: z.number() })).default([]),
});

const siNo = z.enum(['si', 'no']);

export const categoriaSchema = z.object({ ...base, nombre: z.string().min(1), descripcion: z.string().nullable() });

export const productoSchema = z.object({
  ...base,
  slug: z.string().min(1),
  nombre: z.string().min(1),
  /** Relación ya resuelta por la plataforma; `null` si la categoría ya no es pública. */
  categoria: z.object({ slug: z.string(), nombre: z.string() }).nullable(),
  resumen: z.string(),
  tipo: z.string(),
  banda: z.string(),
  specs: z.array(z.string()),
  aplicaciones: z.array(z.string()),
  fotos: z.array(fotoSchema),
  esPlaceholder: siNo,
});

export const servicioSchema = z.object({
  ...base,
  slug: z.string().min(1),
  titulo: z.string().min(1),
  gancho: z.string(),
  descripcion: z.string(),
  textoBoton: z.string(),
  motivo: z.string(),
  icono: z.string(),
});

export const sectorSchema = z.object({
  ...base,
  slug: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string(),
  icono: z.string(),
});

export const zonaSchema = z.object({
  ...base,
  slug: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: z.string(),
  notaInteres: z.string().nullable(),
  pendienteValidacion: siNo,
});

export const preguntaSchema = z.object({ ...base, pregunta: z.string().min(1), respuesta: z.string() });

export const marcaSchema = z.object({ ...base, nombre: z.string(), logo: fotoSchema });

export const accesoRapidoSchema = z.object({
  ...base,
  titulo: z.string().min(1),
  descripcion: z.string(),
  enlace: z.string(),
  textoBoton: z.string(),
  icono: z.string(),
});

export const valorSchema = z.object({
  ...base,
  titulo: z.string().min(1),
  descripcion: z.string(),
  icono: z.string(),
});
