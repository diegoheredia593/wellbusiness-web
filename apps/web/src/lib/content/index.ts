/**
 * Capa de acceso a contenido del sitio (Fase 4) — lo único que
 * páginas/componentes usan para leer texto (bloques) y colecciones. Nunca
 * se importa desde una página estática (ver `./fuente.ts`).
 *
 * A diferencia del contenido local y confiable que aún usa Fluvida, este se
 * edita en vivo desde el portal — por eso cada colección hace `safeParse`
 * **por ítem** (nunca sobre el arreglo completo): un borrador a medio
 * llenar en la base nunca debe tumbar toda la página, solo ese ítem se
 * omite.
 *
 * Traduce del lado del CMS (campos en español: `nombre`, `resumen`, ...) al
 * lado del sitio (`src/data/types.ts`, en inglés) — así ningún componente
 * tuvo que cambiar cuando cambió la fuente de datos.
 */
import type { z } from 'zod';
import { soloPublicados, type ItemBase } from '@cms/core/schema';
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
} from '@clientes/wellbusiness/esquemas';
import type { bloques as definicionesBloques } from '@clientes/wellbusiness/bloques';
import { obtenerFuente } from './fuente';
import type {
  CompanyValue,
  ContactMotive,
  CoverageZone,
  FaqItem,
  IconName,
  MarqueeLogo,
  Product,
  QuickLink,
  SectorItem,
  ServiceItem,
} from '../../data/types';

// ---------------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------------

export type ClaveBloque = (typeof definicionesBloques)[number]['key'];

export interface Bloques {
  /** Texto de un bloque. Devuelve '' si está vacío. */
  t(key: ClaveBloque): string;
  /** Texto opcional: `null` si está vacío (canal/campo sin configurar). */
  o(key: ClaveBloque): string | null;
}

/** Todos los bloques en una sola consulta — llamar una vez por página. */
export async function getBlocks(): Promise<Bloques> {
  const lista = await obtenerFuente().bloques();
  const mapa = new Map(lista.map((b) => [b.key, b.valor]));
  const obtener = (key: string) => mapa.get(key);
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
    correo: b.o('global.contacto.correo'),
    direccion: b.o('global.contacto.direccion'),
    horario: b.o('global.contacto.horario'),
    facebook: b.o('global.contacto.facebook'),
  };
}
export type Contacto = ReturnType<typeof contactoDe>;

// ---------------------------------------------------------------------------
// Colecciones — ayudantes genéricos
// ---------------------------------------------------------------------------

/** Todos los ítems válidos de una colección, en cualquier estado. Un ítem inválido se omite (nunca rompe la colección completa). */
async function todos<S extends z.ZodType<ItemBase>>(nombre: string, schema: S): Promise<z.infer<S>[]> {
  const crudo = await obtenerFuente().coleccion(nombre);
  const validos: z.infer<S>[] = [];
  for (const item of crudo) {
    const r = schema.safeParse(item);
    if (r.success) validos.push(r.data);
  }
  return validos;
}

async function publicados<S extends z.ZodType<ItemBase>>(nombre: string, schema: S): Promise<z.infer<S>[]> {
  return soloPublicados(await todos(nombre, schema));
}

// ---------------------------------------------------------------------------
// Catálogo — categorías / productos
// ---------------------------------------------------------------------------

/** Nombre de cada categoría, en su orden real — incluye borradores, para no ocultar un producto por culpa de su categoría. */
async function mapaCategorias(): Promise<Map<string, string>> {
  const items = await todos('categorias', categoriaSchema);
  return new Map(items.map((c) => [c.slug, c.nombre]));
}

export async function getCategorias(): Promise<string[]> {
  const items = await publicados('categorias', categoriaSchema);
  return items.map((c) => c.nombre);
}

function mapearProducto(p: z.infer<typeof productoSchema>, categorias: Map<string, string>): Product {
  return {
    slug: p.slug,
    category: categorias.get(p.categoria) ?? p.categoria,
    name: p.nombre,
    summary: p.resumen,
    type: p.tipo,
    band: p.banda,
    specs: p.specs,
    applications: p.aplicaciones,
    fotos: p.fotos,
    isPlaceholder: p.esPlaceholder === 'si',
  };
}

export async function getProductos(): Promise<Product[]> {
  const [items, categorias] = await Promise.all([publicados('productos', productoSchema), mapaCategorias()]);
  return items.map((p) => mapearProducto(p, categorias));
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
    interestNote: z.notaInteres.trim() ? z.notaInteres : undefined,
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
  return items.map((m) => ({ src: m.logo.src, alt: m.logo.alt }));
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
