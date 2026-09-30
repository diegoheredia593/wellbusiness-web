/**
 * Capa de acceso a contenido del sitio — lo único que páginas/componentes usan para leer texto
 * (bloques) y colecciones. Nunca se importa desde una página estática (ver `./fuente.ts`).
 *
 * Desde el Sprint 4e el contenido viene de la plataforma (`/v1/bloques`, `/v1/colecciones`), que
 * la agencia edita desde su portal. Cada colección hace `safeParse` **por ítem** (nunca sobre el
 * arreglo completo): un ítem con datos raros nunca debe tumbar toda la página, solo ese ítem se
 * omite. La plataforma ya entrega solo lo público, ordenado por `orden`.
 *
 * Traduce del lado de la plataforma (campos en español: `nombre`, `resumen`, ...) al lado del
 * sitio (`src/data/types.ts`, en inglés) — así ningún componente tuvo que cambiar cuando cambió
 * la fuente de datos. Las imágenes `{ src, alt, width, height }` de la plataforma se adaptan al
 * tipo `Imagen` del sitio (`ancho`/`alto`).
 */
import type { z } from 'zod';
import {
  categoriaSchema,
  productoSchema,
  servicioSchema,
  sectorSchema,
  zonaSchema,
  preguntaSchema,
  marcaSchema,
  accesoRapidoSchema,
  valorSchema,
  fotoSchema,
} from './esquemas';
import { leerBloques, leerColeccion } from './fuente';
import { urlPublicaDeMedio } from '../plataforma/medios';
import type { ClaveBloque } from './claves-bloques';
import type {
  CompanyValue,
  ContactMotive,
  CoverageZone,
  FaqItem,
  IconName,
  Imagen,
  MarqueeLogo,
  Product,
  QuickLink,
  SectorItem,
  ServiceItem,
} from '../../data/types';

// ---------------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------------

export type { ClaveBloque };

export interface Bloques {
  /** Texto de un bloque. Devuelve '' si está vacío. */
  t(key: ClaveBloque): string;
  /** Texto opcional: `null` si está vacío (canal/campo sin configurar). */
  o(key: ClaveBloque): string | null;
}

/** Todos los bloques (una petición, guardada en memoria por versión) — llamar una vez por página. */
export async function getBlocks(): Promise<Bloques> {
  const lista = await leerBloques();
  const obtener = (key: string) => lista[key]?.valor;
  return {
    t: (key) => {
      const v = obtener(key);
      return typeof v === 'string' ? v : '';
    },
    o: (key) => {
      const v = obtener(key);
      return typeof v === 'string' && v.trim() !== '' ? v : null;
    },
  };
}

/** Marca global (`global.marca.*`) — derivado del mismo `Bloques` que ya pidió la página. */
export function marcaDe(b: Bloques) {
  return {
    nombre: b.t('global.marca.nombre'),
    empresaMadre: b.t('global.marca.empresaMadre'),
    tagline: b.t('global.marca.tagline'),
    descripcionPorDefecto: b.t('global.marca.descripcionPorDefecto'),
    dealerMotorola: b.t('global.marca.dealerMotorola'),
  };
}
export type Marca = ReturnType<typeof marcaDe>;

/** Contacto global (`global.contacto.*`) — vacío = canal oculto, igual que antes con `null`. */
export function contactoDe(b: Bloques) {
  return {
    whatsapp: b.o('global.contacto.whatsapp'),
    telefono: b.o('global.contacto.telefono'),
    telefonoSoporte: b.o('global.contacto.telefonoSoporte'),
    correo: b.o('global.contacto.correo'),
    correoGerencia: b.o('global.contacto.correoGerencia'),
    correoInfo: b.o('global.contacto.correoInfo'),
    direccion: b.o('global.contacto.direccion'),
    horario: b.o('global.contacto.horario'),
    facebook: b.o('global.contacto.facebook'),
    instagram: b.o('global.contacto.instagram'),
  };
}
export type Contacto = ReturnType<typeof contactoDe>;

// ---------------------------------------------------------------------------
// Colecciones — ayudantes genéricos
// ---------------------------------------------------------------------------

/** Ítems públicos y válidos de una colección. Un ítem inválido se omite (nunca rompe la colección completa). */
async function publicados<S extends z.ZodType>(nombre: string, schema: S): Promise<z.infer<S>[]> {
  const crudo = await leerColeccion(nombre);
  const validos: z.infer<S>[] = [];
  for (const item of crudo) {
    const r = schema.safeParse(item);
    if (r.success) validos.push(r.data);
    else console.warn(`Ítem omitido en «${nombre}» (${String(item.id)}): forma inesperada.`);
  }
  return validos;
}

/** Foto de la plataforma (`width`/`height`) → `Imagen` del sitio (`ancho`/`alto`). */
function aImagen(f: z.infer<typeof fotoSchema>): Imagen {
  return { src: urlPublicaDeMedio(f.src), alt: f.alt, ancho: f.width, alto: f.height };
}

// ---------------------------------------------------------------------------
// Catálogo — categorías / productos
// ---------------------------------------------------------------------------

export async function getCategorias(): Promise<string[]> {
  const items = await publicados('categorias', categoriaSchema);
  return items.map((c) => c.nombre);
}

function mapearProducto(p: z.infer<typeof productoSchema>): Product {
  return {
    slug: p.slug,
    category: p.categoria?.nombre ?? '',
    name: p.nombre,
    summary: p.resumen,
    type: p.tipo,
    band: p.banda,
    specs: p.specs,
    applications: p.aplicaciones,
    fotos: p.fotos.map(aImagen),
    isPlaceholder: p.esPlaceholder === 'si',
  };
}

export async function getProductos(): Promise<Product[]> {
  const items = await publicados('productos', productoSchema);
  return items.map(mapearProducto);
}

export async function getProducto(slug: string): Promise<Product | null> {
  return (await getProductos()).find((p) => p.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Servicios / Sectores
// ---------------------------------------------------------------------------

export async function getServicios(): Promise<ServiceItem[]> {
  const items = await publicados('servicios', servicioSchema);
  return items.map((s) => ({
    slug: s.slug,
    title: s.titulo,
    hook: s.gancho,
    description: s.descripcion,
    ctaLabel: s.textoBoton,
    motive: s.motivo as ContactMotive,
    icon: s.icono as IconName,
  }));
}

export async function getSectores(): Promise<SectorItem[]> {
  const items = await publicados('sectores', sectorSchema);
  return items.map((s) => ({ slug: s.slug, title: s.titulo, description: s.descripcion, icon: s.icono as IconName }));
}

// ---------------------------------------------------------------------------
// Cobertura
// ---------------------------------------------------------------------------

export async function getZonasCobertura(): Promise<CoverageZone[]> {
  const items = await publicados('zonas', zonaSchema);
  return items.map((z) => ({
    slug: z.slug,
    title: z.titulo,
    description: z.descripcion,
    interestNote: z.notaInteres?.trim() ? z.notaInteres : undefined,
    pendingValidation: z.pendienteValidacion === 'si',
  }));
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export async function getFaq(): Promise<FaqItem[]> {
  const items = await publicados('preguntas', preguntaSchema);
  return items.map((p) => ({ question: p.pregunta, answer: p.respuesta }));
}

// ---------------------------------------------------------------------------
// Marcas / logos
// ---------------------------------------------------------------------------

export async function getMarcas(): Promise<MarqueeLogo[]> {
  const items = await publicados('marcas', marcaSchema);
  return items.map((m) => ({ src: aImagen(m.logo).src, alt: m.logo.alt }));
}

// ---------------------------------------------------------------------------
// Accesos rápidos (Inicio) / Valores (Nosotros)
// ---------------------------------------------------------------------------

export async function getAccesosRapidos(): Promise<QuickLink[]> {
  const items = await publicados('accesosRapidos', accesoRapidoSchema);
  return items.map((a) => ({
    title: a.titulo,
    description: a.descripcion,
    href: a.enlace,
    linkLabel: a.textoBoton,
    icon: a.icono as IconName,
  }));
}

export async function getValores(): Promise<CompanyValue[]> {
  const items = await publicados('valores', valorSchema);
  return items.map((v) => ({ title: v.titulo, description: v.descripcion, icon: v.icono as IconName }));
}
