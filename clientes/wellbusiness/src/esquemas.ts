/**
 * Colecciones de Wellbusiness.
 *
 * Cada campo lleva con `.meta()` su nombre en español y el tipo de control
 * que usa el portal para editarlo. El contenido inicial real (transcrito de
 * `apps/web/src/data/*.ts`) vive en `./colecciones.ts`.
 */
import { z } from 'zod';
import {
  definirColeccion,
  imagenSchema,
  type DefinicionColeccion,
} from '@cms/core/schema';
import '@cms/core/campos';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

/** Dirección de la página (se genera desde otro campo). */
const direccion = (desde: string) =>
  slug.meta({
    etiqueta: 'Dirección de la página',
    control: 'slug',
    desde,
    ayuda: 'Se genera sola a partir del nombre/título. Cambiarla rompe los enlaces que ya se hayan compartido.',
  });

const img = (etiqueta: string, proporcion: `${number}:${number}` | null, ayuda?: string) =>
  imagenSchema.meta({ etiqueta, proporcion, ...(ayuda ? { ayuda } : {}) });

const galeriaFotos = z.array(imagenSchema).meta({
  etiqueta: 'Fotos',
  proporcion: null,
  ayuda: 'La primera foto es la portada del producto. Puedes subir varias y ordenarlas arrastrando.',
});

const enlaceInterno = z
  .string()
  .min(1)
  .meta({
    control: 'enlace',
    etiqueta: 'Enlace',
    ayuda: 'Una página del sitio (por ejemplo /catalogo) o una dirección que empiece con https://',
  });

/**
 * Íconos de contenido disponibles para editores (`IconName` en
 * `apps/web/src/data/types.ts`, dibujados a mano en `Icon.astro` — no hay
 * librería de íconos). Deliberadamente excluye los íconos de interfaz del
 * mismo `IconName` (`chevron-right`, `menu`, `close`, `whatsapp`, `facebook`,
 * `phone`, `mail`, `pin`, `zoom`, `clock`) — esos son de UI fija (nav,
 * `Icon.astro`, footer) y no los usa ningún campo de contenido hoy
 * (confirmado por grep en `apps/web/src`); si en el futuro alguna colección
 * necesitara uno, hay que agregarlo aquí explícitamente. Fragmento único,
 * reutilizado por `productos`/`servicios`/`sectores`/`accesosRapidos`/
 * `valores` para que el enum nunca se desalinee entre colecciones.
 */
export const nombresIconos = {
  'radio-handheld': 'Radio portátil',
  'radio-mobile': 'Radio móvil',
  tower: 'Torre / repetidor',
  accessory: 'Accesorio',
  shield: 'Escudo (seguridad/confidencialidad)',
  truck: 'Camión (transporte)',
  factory: 'Fábrica (industrial)',
  leaf: 'Hoja (agrícola)',
  building: 'Edificio (institucional)',
  wrench: 'Llave (mantenimiento)',
  map: 'Mapa (cobertura)',
  signal: 'Señal',
  warehouse: 'Bodega',
  compass: 'Brújula (asesoría/orientación)',
  check: 'Check / cumplimiento',
} as const;
const icono = z.enum(Object.keys(nombresIconos) as [keyof typeof nombresIconos]).meta({
  etiqueta: 'Ícono',
  opciones: nombresIconos,
});

/**
 * Los 7 motivos de contacto (`ContactMotive` en `apps/web/src/data/types.ts`)
 * — la lista de motivos en sí se queda fija en código (es taxonomía del
 * formulario, no contenido editable); un servicio solo elige uno.
 */
const motivosContacto = {
  'Catálogo Motorola': 'Catálogo Motorola',
  Alquiler: 'Alquiler',
  'Mantenimiento o reparación': 'Mantenimiento o reparación',
  Cobertura: 'Cobertura',
  Infraestructura: 'Infraestructura',
  'Estudios de ingeniería': 'Estudios de ingeniería',
  Otro: 'Otro',
} as const;
const motivo = z.enum(Object.keys(motivosContacto) as [keyof typeof motivosContacto]).meta({
  etiqueta: 'Motivo de contacto',
  opciones: motivosContacto,
});

const siNo = { si: 'Sí', no: 'No' } as const;

// ─── Catálogo ────────────────────────────────────────────────────────────

export const categoriaSchema = definirColeccion({
  nombre: z.string().min(1).max(60).meta({ etiqueta: 'Nombre' }),
  slug: direccion('nombre'),
  descripcion: z
    .string()
    .max(200)
    .nullable()
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
});

export const productoSchema = definirColeccion({
  nombre: z.string().min(1).max(80).meta({ etiqueta: 'Nombre' }),
  slug: direccion('nombre'),
  categoria: slug.meta({
    etiqueta: 'Categoría',
    relacion: { coleccion: 'categorias', valor: 'slug', etiqueta: 'nombre' },
  }),
  resumen: z
    .string()
    .min(1)
    .max(600)
    .meta({ etiqueta: 'Resumen', control: 'textoLargo' }),
  tipo: z.string().min(1).max(40).meta({ etiqueta: 'Tipo (p. ej. "Portátil")' }),
  banda: z.string().min(1).max(100).meta({ etiqueta: 'Banda de frecuencia' }),
  specs: z.array(z.string().max(160)).meta({ etiqueta: 'Especificaciones y beneficios' }),
  aplicaciones: z.array(z.string().max(60)).meta({ etiqueta: 'Aplicaciones sugeridas' }),
  fotos: galeriaFotos,
  esPlaceholder: z.enum(['si', 'no']).meta({
    etiqueta: '¿Es una ficha de ejemplo (no un producto real confirmado)?',
    opciones: siNo,
  }),
});

// ─── Servicios ───────────────────────────────────────────────────────────

export const servicioSchema = definirColeccion({
  titulo: z.string().min(1).max(80).meta({ etiqueta: 'Título' }),
  slug: direccion('titulo'),
  gancho: z.string().min(1).max(120).meta({ etiqueta: 'Frase gancho' }),
  descripcion: z
    .string()
    .min(1)
    .max(400)
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
  textoBoton: z.string().min(1).max(40).meta({ etiqueta: 'Texto del botón' }),
  motivo,
  icono,
});

// ─── Sectores ────────────────────────────────────────────────────────────

export const sectorSchema = definirColeccion({
  titulo: z.string().min(1).max(80).meta({ etiqueta: 'Título' }),
  slug: direccion('titulo'),
  descripcion: z
    .string()
    .min(1)
    .max(300)
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
  icono,
});

// ─── Cobertura ───────────────────────────────────────────────────────────

export const zonaSchema = definirColeccion({
  titulo: z.string().min(1).max(80).meta({ etiqueta: 'Título' }),
  slug: direccion('titulo'),
  descripcion: z
    .string()
    .min(1)
    .max(500)
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
  notaInteres: z
    .string()
    .max(300)
    .meta({
      etiqueta: 'Nota de sectores de interés',
      control: 'textoLargo',
      ayuda: 'Déjala vacía si esta zona no tiene una nota de sectores de interés.',
    }),
  pendienteValidacion: z.enum(['si', 'no']).meta({
    etiqueta: '¿Pendiente de verificación técnica?',
    opciones: siNo,
    ayuda: 'Mientras esté en "Sí", el sitio muestra el badge "Referencial" y el aviso de cobertura aproximada.',
  }),
});

// ─── FAQ ─────────────────────────────────────────────────────────────────

export const preguntaSchema = definirColeccion({
  pregunta: z.string().min(1).max(160).meta({ etiqueta: 'Pregunta' }),
  respuesta: z
    .string()
    .min(1)
    .max(500)
    .meta({ etiqueta: 'Respuesta', control: 'textoLargo' }),
});

// ─── Marcas / logos ──────────────────────────────────────────────────────

export const marcaSchema = definirColeccion({
  nombre: z.string().min(1).max(60).meta({ etiqueta: 'Nombre de la marca' }),
  logo: img('Logo', null, 'Idealmente PNG/SVG con fondo transparente, recortado a su propio contenido.'),
});

// ─── Accesos rápidos (home) ──────────────────────────────────────────────

export const accesoRapidoSchema = definirColeccion({
  titulo: z.string().min(1).max(60).meta({ etiqueta: 'Título' }),
  descripcion: z
    .string()
    .min(1)
    .max(200)
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
  enlace: enlaceInterno,
  textoBoton: z.string().min(1).max(40).meta({ etiqueta: 'Texto del enlace' }),
  icono,
});

// ─── Valores (Nosotros) ──────────────────────────────────────────────────

export const valorSchema = definirColeccion({
  titulo: z.string().min(1).max(40).meta({ etiqueta: 'Título' }),
  descripcion: z
    .string()
    .min(1)
    .max(300)
    .meta({ etiqueta: 'Descripción', control: 'textoLargo' }),
  icono,
});

export const colecciones = {
  categorias: {
    schema: categoriaSchema,
    etiqueta: 'Categorías de catálogo',
    singular: 'categoría',
    genero: 'f',
    descripcion: 'Pestañas del catálogo (Radios portátiles, Repetidoras, ...).',
    campoTitulo: 'nombre',
    campoSlug: 'slug',
    ordenarPor: 'orden',
    grupo: 'Catálogo',
  },
  productos: {
    schema: productoSchema,
    etiqueta: 'Productos',
    singular: 'producto',
    genero: 'm',
    descripcion: 'Radios, repetidoras y accesorios Motorola del catálogo.',
    campoTitulo: 'nombre',
    busqueda: ['nombre', 'resumen'],
    campoSlug: 'slug',
    ordenarPor: 'orden',
    grupo: 'Catálogo',
  },
  servicios: {
    schema: servicioSchema,
    etiqueta: 'Servicios',
    singular: 'servicio',
    genero: 'm',
    descripcion: 'Tarjetas de la página Servicios.',
    campoTitulo: 'titulo',
    campoSlug: 'slug',
    ordenarPor: 'orden',
    grupo: 'Páginas',
  },
  sectores: {
    schema: sectorSchema,
    etiqueta: 'Sectores',
    singular: 'sector',
    genero: 'm',
    descripcion: 'Tarjetas de la página Sectores.',
    campoTitulo: 'titulo',
    campoSlug: 'slug',
    ordenarPor: 'orden',
    grupo: 'Páginas',
  },
  zonas: {
    schema: zonaSchema,
    etiqueta: 'Zonas de cobertura',
    singular: 'zona',
    genero: 'f',
    descripcion: 'Tarjetas de la página Cobertura.',
    campoTitulo: 'titulo',
    campoSlug: 'slug',
    ordenarPor: 'orden',
    grupo: 'Páginas',
  },
  preguntas: {
    schema: preguntaSchema,
    etiqueta: 'Preguntas frecuentes',
    singular: 'pregunta',
    genero: 'f',
    descripcion: 'FAQ de la página Contacto.',
    campoTitulo: 'pregunta',
    ordenarPor: 'orden',
    grupo: 'Contacto',
  },
  marcas: {
    schema: marcaSchema,
    etiqueta: 'Marcas y tecnología',
    singular: 'marca',
    genero: 'f',
    descripcion: 'Logos de la franja de marcas (Inicio y Nosotros).',
    campoTitulo: 'nombre',
    ordenarPor: 'orden',
    grupo: 'Marcas',
  },
  accesosRapidos: {
    schema: accesoRapidoSchema,
    etiqueta: 'Accesos rápidos (Inicio)',
    singular: 'acceso rápido',
    genero: 'm',
    descripcion: 'Tarjetas de "Acceso rápido a soluciones" en Inicio.',
    campoTitulo: 'titulo',
    ordenarPor: 'orden',
    grupo: 'Páginas',
  },
  valores: {
    schema: valorSchema,
    etiqueta: 'Valores (Nosotros)',
    singular: 'valor',
    genero: 'm',
    descripcion: 'Tarjetas de "Nuestros valores" en Nosotros.',
    campoTitulo: 'titulo',
    ordenarPor: 'orden',
    grupo: 'Páginas',
  },
} satisfies Record<string, DefinicionColeccion>;
