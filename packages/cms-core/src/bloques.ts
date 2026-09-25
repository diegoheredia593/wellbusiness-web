/**
 * Ayudantes genéricos para declarar bloques fijos de forma compacta.
 * Cada cliente define sus propias etiquetas de página/sección y qué bloques
 * son de nivel `sistema`.
 */
import type {
  DefinicionBloque,
  Imagen,
  NivelBloque,
  Proporcion,
  TextoEnriquecido,
  TipoBloque,
  ValorBloque,
} from './schema';

export interface EtiquetasSitio {
  paginas: Record<string, string>;
  secciones: Record<string, string>;
  /**
   * Bloques de nivel `sistema`. Cada entrada es una clave exacta
   * (`global.nav.saltar`) o un prefijo terminado en `*` (`formularios.ui.*`).
   * Todo lo demás es `contenido`.
   */
  sistema?: string[];
}

interface Opciones {
  max?: number;
  obligatorio?: boolean;
  /** Fuerza el nivel, por encima de la lista `sistema`. */
  nivel?: NivelBloque;
  ayuda?: string;
  /** Solo imágenes. */
  proporcion?: Proporcion;
}

/** Límites por defecto según tipo, si no se especifican. */
const LIMITE_POR_TIPO: Record<TipoBloque, number | null> = {
  texto: 120,
  texto_largo: 600,
  texto_enriquecido: 3000,
  url: 500,
  imagen: null,
};

/** ¿La clave coincide con alguno de los patrones (exactos o con `*` final)? */
export function coincidePatron(key: string, patrones: readonly string[]): boolean {
  return patrones.some((p) => (p.endsWith('*') ? key.startsWith(p.slice(0, -1)) : key === p));
}

export function crearDeclarador(etiquetas: EtiquetasSitio) {
  const sistema = etiquetas.sistema ?? [];

  function bloque<K extends string, T extends TipoBloque>(
    key: K,
    campo: string,
    tipo: T,
    valor: ValorBloque<T>,
    opciones: Opciones = {},
  ): DefinicionBloque<T> & { key: K } {
    const [pagina = '', seccion = ''] = key.split('.');
    const etqPagina = etiquetas.paginas[pagina] ?? pagina;
    const etqSeccion = etiquetas.secciones[`${pagina}.${seccion}`] ?? seccion;
    return {
      key,
      pagina,
      seccion,
      etiqueta: `${etqPagina} → ${etqSeccion} → ${campo}`,
      campo,
      tipo,
      nivel: opciones.nivel ?? (coincidePatron(key, sistema) ? 'sistema' : 'contenido'),
      ...(opciones.ayuda ? { ayuda: opciones.ayuda } : {}),
      ...(tipo === 'imagen' ? { proporcion: opciones.proporcion ?? null } : {}),
      maxLength: opciones.max ?? LIMITE_POR_TIPO[tipo],
      // Por defecto un bloque es obligatorio si tiene valor al declararse.
      obligatorio: opciones.obligatorio ?? valor !== null,
      valor,
    };
  }

  return {
    texto: <K extends string>(key: K, campo: string, valor: string | null, o?: Opciones) =>
      bloque(key, campo, 'texto', valor, o),
    largo: <K extends string>(key: K, campo: string, valor: string | null, o?: Opciones) =>
      bloque(key, campo, 'texto_largo', valor, o),
    rico: <K extends string>(key: K, campo: string, valor: TextoEnriquecido | null, o?: Opciones) =>
      bloque(key, campo, 'texto_enriquecido', valor, o),
    url: <K extends string>(key: K, campo: string, valor: string | null, o?: Opciones) =>
      bloque(key, campo, 'url', valor, o),
    imagen: <K extends string>(key: K, campo: string, valor: Imagen | null, o?: Opciones) =>
      bloque(key, campo, 'imagen', valor, o),
  };
}

// ---------------------------------------------------------------------------
// Ayudantes de texto enriquecido para escribir contenido local legible
// ---------------------------------------------------------------------------

/** Un párrafo de texto plano. */
export const p = (texto: string) => ({ tipo: 'parrafo' as const, contenido: [{ texto }] });

/** Un párrafo con fragmentos: strings normales y `{ texto, negrita }` etc. */
export const pr = (...partes: (string | { texto: string; negrita?: boolean; cursiva?: boolean; enlace?: string })[]) => ({
  tipo: 'parrafo' as const,
  contenido: partes.map((x) => (typeof x === 'string' ? { texto: x } : x)),
});

/** Lista de viñetas de texto plano. */
export const ul = (...items: string[]) => ({
  tipo: 'lista' as const,
  ordenada: false,
  items: items.map((texto) => [{ texto }]),
});
