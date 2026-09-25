/**
 * Fuentes de contenido. El sitio lee siempre a través de una fuente; hoy es
 * la local (archivos del cliente) y en la fase 3 será D1, con la misma forma.
 */
import type { DefinicionBloque, ItemBase } from './schema';
import type { D1Minimo } from './db/migraciones';

export interface FuenteContenido {
  /** Todos los bloques (o solo los de ciertas páginas), con su valor publicado. */
  bloques(paginas?: string[]): Promise<DefinicionBloque[]>;
  /** Todos los ítems de una colección (fuera de la papelera), en cualquier estado. */
  coleccion(nombre: string): Promise<unknown[]>;
}

/** Fuente local: las definiciones y el contenido inicial del cliente. */
export function crearFuenteLocal(
  definiciones: readonly DefinicionBloque[],
  colecciones: Record<string, readonly unknown[]>,
): FuenteContenido {
  return {
    async bloques(paginas) {
      return paginas ? definiciones.filter((b) => paginas.includes(b.pagina)) : [...definiciones];
    },
    async coleccion(nombre) {
      return [...(colecciones[nombre] ?? [])];
    },
  };
}

interface FilaBloque {
  key: string;
  valor: string | null;
}
interface FilaItem {
  id: string;
  estado: ItemBase['estado'];
  orden: number;
  datos: string;
  creado: string;
  actualizado: string;
}

/**
 * Fuente D1 (fase 3). Las definiciones siguen viniendo del código; de la base
 * solo se toman los valores. Un bloque que no está en la base conserva el
 * valor de su definición.
 */
export function crearFuenteD1(db: D1Minimo, definiciones: readonly DefinicionBloque[]): FuenteContenido {
  return {
    async bloques(paginas) {
      const { results } = await db.prepare('SELECT key, valor FROM bloques').all<FilaBloque>();
      const valores = new Map(results.map((r) => [r.key, r.valor]));
      return definiciones
        .filter((b) => !paginas || paginas.includes(b.pagina))
        .map((b) => (valores.has(b.key) ? { ...b, valor: JSON.parse(valores.get(b.key) ?? 'null') } : b));
    },
    async coleccion(nombre) {
      const { results } = await db
        .prepare(
          'SELECT id, estado, orden, datos, creado, actualizado FROM items WHERE coleccion = ? AND eliminado_en IS NULL ORDER BY orden',
        )
        .bind(nombre)
        .all<FilaItem>();
      return results.map(({ datos, ...base }) => ({ ...JSON.parse(datos), ...base }));
    },
  };
}
