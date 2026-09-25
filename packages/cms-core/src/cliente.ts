/**
 * Forma de la configuración de un cliente. El portal solo conoce este tipo:
 * todo lo específico (nombre, colores, bloques, colecciones, formularios y
 * contenido inicial) viene de `clientes/<cliente>/`.
 */
import type { TipoAlmacen } from './almacen';
import type { DefinicionBloque, DefinicionColeccion } from './schema';

export interface DefinicionFormulario {
  /** Nombre legible del formulario, p. ej. "Inscripción a cursos". */
  etiqueta: string;
  /** Campos en orden: nombre técnico → nombre legible. */
  campos: Record<string, string>;
  /** Valores con nombre legible (p. ej. motivo: donar → "Donar"). */
  opciones?: Record<string, Record<string, string>>;
}

export interface ConfiguracionPortal {
  /** Nombre que se ve en el portal, p. ej. "Portal Fluvida". */
  titulo: string;
  /** Logo del cliente (URL servida por el portal). */
  logo: string;
  /**
   * Color de acento del portal (botones, enlaces, foco). El portal lo
   * oscurece si no alcanza contraste AA con texto blanco.
   */
  colorAcento: string;
  /**
   * Modo "requiere aprobación": los editores solo guardan borradores y un
   * admin publica.
   */
  requiereAprobacion: boolean;
  /** Días que un elemento eliminado queda en la papelera. */
  diasPapelera: number;
  /** Zona horaria para mostrar fechas, p. ej. "America/Guayaquil". */
  zonaHoraria: string;
  /** Qué puede hacer un editor además de editar. */
  editores: {
    /** Mandar ítems a la papelera. */
    eliminar: boolean;
  };
  /**
   * Dónde se guardan las fotos. El binding se llama `MEDIOS` en los dos
   * casos: un namespace de Workers KV o un bucket de R2.
   */
  almacenamiento: {
    tipo: TipoAlmacen;
    /** Espacio disponible para fotos, en bytes (se muestra en la pantalla Fotos). */
    limiteBytes: number;
  };
}

export interface ConfiguracionCliente {
  /** Identificador corto, p. ej. "fluvida". */
  id: string;
  /** Nombre de la organización. */
  nombre: string;
  sitio: {
    /** URL pública del sitio, p. ej. "https://fluvida.org". */
    url: string;
  };
  portal: ConfiguracionPortal;
  /** Nombres legibles de páginas y secciones de los bloques. */
  etiquetas: {
    paginas: Record<string, string>;
    secciones: Record<string, string>;
  };
  bloques: readonly DefinicionBloque[];
  colecciones: Record<string, DefinicionColeccion>;
  formularios: Record<string, DefinicionFormulario>;
  /** Contenido que se carga en la base la primera vez. */
  contenidoInicial: {
    colecciones: Record<string, readonly unknown[]>;
    /** Envíos de ejemplo para ver la pantalla de formularios antes de la fase 3. */
    enviosEjemplo: { tipo: string; datos: Record<string, string>; creado: string }[];
  };
}

/** Ayuda a declarar la configuración con tipos. */
export function definirCliente(config: ConfiguracionCliente): ConfiguracionCliente {
  return config;
}
