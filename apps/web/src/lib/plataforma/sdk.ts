/**
 * COPIA del núcleo del SDK de la plataforma (`@plataforma/sdk`), sin dependencias.
 *
 * Origen: repo `agencia-plataforma`, `packages/sdk/src/index.ts`, commit 8cd5374d808479d93000802d2a3a5bc6b344d09d (HEAD limpio al copiar, 2026-10-12; ese mismo commit es el último que tocó el SDK, sprint 9a: registrarVisita y scriptVisitas).
 * Diferencia con el original: no se copia `render.ts` (texto enriquecido / YouTube), que depende de
 * `@plataforma/core` y que este sitio no usa. `imagenResponsiva` (sprint 6a) vive en `imagen.ts`, sin dependencias.
 * Otra diferencia: `export * from './imagen'` en vez de `export * from './render'`.
 * Publicar el SDK como paquete queda para después; mientras, al actualizarlo se re-copia a mano.
 */
/**
 * SDK público para los sitios de los clientes (sprint 4a) — TypeScript sin dependencias
 * de terceros, solo `fetch` (inyectable, ver `fetch?` en OpcionesCliente). Consume
 * GET /v1/* (ver docs/api.md): siempre con la llave en Authorization: Bearer, nunca con
 * sesión. `elemento()` devuelve `null` en un 404 (no existe no es una excepción para un
 * getter puntual); todo lo demás lanza ErrorApiPlataforma en cualquier respuesta que no
 * sea 2xx/304.
 */
import type { Bloque, ClaveColeccion, Colecciones, ElementoPersonalizado } from './tipos';

export * from './tipos';
export * from './imagen';

export class ErrorApiPlataforma extends Error {
  readonly status: number;
  readonly detalle: unknown;
  /** En un 429: segundos que indica el encabezado Retry-After (si vino). */
  readonly reintentarEnSegundos: number | undefined;

  constructor(status: number, message: string, detalle: unknown, reintentarEnSegundos?: number) {
    super(message);
    this.name = 'ErrorApiPlataforma';
    this.status = status;
    this.detalle = detalle;
    this.reintentarEnSegundos = reintentarEnSegundos;
  }

  /**
   * En un 422 de enviarFormulario: un error por campo (`campo` vacío = error general).
   * Vacío en cualquier otro caso.
   */
  get errores(): { campo: string; mensaje: string }[] {
    const lista =
      this.detalle && typeof this.detalle === 'object' && 'errores' in this.detalle
        ? (this.detalle as { errores: unknown }).errores
        : undefined;
    return Array.isArray(lista) ? (lista as { campo: string; mensaje: string }[]) : [];
  }
}

export interface OpcionesCliente {
  /** URL base de /v1 (ver docs/api.md por modo: temporal o dominio). Sin la barra final. */
  url: string;
  /** Llave de lectura del cliente (pk_...), creada desde la ficha del superadmin. */
  llave: string;
  /** Para inyectar un fetch propio (tests, runtimes sin fetch global). Por defecto, el global. */
  fetch?: typeof fetch;
}

export interface OpcionesColeccion {
  pagina?: number;
  porPagina?: number;
  /** "campo:asc" o "campo:desc". */
  ordenarPor?: string;
  /** Igualdad exacta por campo, p. ej. { category: "ropa" }. */
  filtro?: Record<string, string>;
  formato?: 'json' | 'html';
}

export interface OpcionesElemento {
  formato?: 'json' | 'html';
}

export interface OpcionesEnvio {
  /**
   * IP del visitante que llenó el formulario. La plataforma limita los envíos por cliente e
   * IP (5 cada 15 minutos): sin esto, TODOS los visitantes del sitio compartirían la IP del
   * servidor y se bloquearían entre sí. Viaja en el encabezado X-Visitor-Ip.
   */
  ip?: string | undefined;
  /** Página del sitio desde la que se envió (p. ej. "/contacto"); se muestra en la bandeja. */
  pagina?: string | undefined;
}

/** Lo que el navegador del visitante le cuenta al sitio (ver `scriptVisitas`). */
export interface DatosVisita {
  /** Ruta de la página vista, sin parámetros: "/contacto". */
  pagina: string;
  /** Sitio desde el que llegó (el origen, p. ej. "https://www.google.com"); vacío si entró directo. */
  referente?: string | undefined;
  utm?:
    { source?: string | undefined; medium?: string | undefined; campaign?: string | undefined } | undefined;
  /** `screen.width` en px, para distinguir móvil, tableta y escritorio. */
  anchoPantalla?: number | undefined;
  /** Dominio del propio sitio ("www.ejemplo.com"), para reconocer la navegación interna. */
  sitio?: string | undefined;
}

/**
 * De la petición del visitante al servidor del sitio: lo que ESE servidor reenvía como encabezados de
 * confianza. La plataforma los usa para decidir robot/dispositivo/país y calcular el visitante del día, y
 * los descarta: nunca guarda la IP ni el user-agent.
 */
export interface OpcionesVisita {
  /** IP del visitante (`cf-connecting-ip`). */
  ip?: string | undefined;
  /** User-agent del visitante. */
  ua?: string | undefined;
  /** País ISO de dos letras (`request.cf.country`). */
  country?: string | undefined;
  /** Ciudad (`request.cf.city`). */
  city?: string | undefined;
}

export interface PaginaDeElementos<T> {
  coleccion: string;
  paginaActual: number;
  porPagina: number;
  totalElementos: number;
  totalPaginas: number;
  elementos: T[];
}

export interface Cliente {
  /** Contador de versión de contenido — consulta barata para saber si algo cambió. */
  version(): Promise<number>;
  bloques(paginas?: string[]): Promise<Record<string, Bloque>>;
  coleccion<K extends ClaveColeccion>(
    modulo: K,
    opciones?: OpcionesColeccion,
  ): Promise<PaginaDeElementos<Colecciones[K]>>;
  /** Una colección personalizada del cliente (sus campos se tipan como registro genérico). */
  coleccion<T extends ElementoPersonalizado = ElementoPersonalizado>(
    modulo: string,
    opciones?: OpcionesColeccion,
  ): Promise<PaginaDeElementos<T>>;
  /** null si no existe, no es público, o la colección no tiene dirección (slug). */
  elemento<K extends ClaveColeccion>(
    modulo: K,
    slug: string,
    opciones?: OpcionesElemento,
  ): Promise<Colecciones[K] | null>;
  elemento<T extends ElementoPersonalizado = ElementoPersonalizado>(
    modulo: string,
    slug: string,
    opciones?: OpcionesElemento,
  ): Promise<T | null>;
  /**
   * Envía un formulario (POST /v1/formularios/:tipo). Requiere una llave con el alcance
   * "formularios:enviar". Llámalo desde el SERVIDOR del sitio, nunca desde el navegador.
   * Lanza ErrorApiPlataforma: 404 (tipo inexistente o inactivo), 403 (la llave no tiene el
   * alcance), 422 (datos inválidos; ver `error.errores`), 429 (límite; ver
   * `error.reintentarEnSegundos`).
   */
  enviarFormulario(
    tipo: string,
    datos: Record<string, string>,
    opciones?: OpcionesEnvio,
  ): Promise<{ id: string }>;
  /**
   * Registra una visita (POST /v1/visitas, responde 202). Requiere una llave con el alcance
   * "visitas:registrar". Llámalo desde el SERVIDOR del sitio —con `waitUntil`, para no demorar al
   * visitante—, nunca desde el navegador. Sin cookies: ver `scriptVisitas()`.
   */
  registrarVisita(datos: DatosVisita, opciones?: OpcionesVisita): Promise<void>;
}

/**
 * El script de visitas para el navegador: menos de 1 KB, sin cookies ni localStorage. Al cargar la página
 * manda con `sendBeacon` la ruta, el origen, los utm y el ancho de pantalla a `endpoint` (por defecto
 * `/api/visita`, del MISMO sitio), que reenvía a la plataforma con `registrarVisita`. No hace nada si el
 * visitante activó No Rastrear (DNT) o Global Privacy Control (GPC). Con el enrutador de vistas de Astro
 * (`ClientRouter`) cuenta también cada navegación (evento `astro:page-load`), con la página anterior como
 * referente, sin duplicar la carga inicial.
 */
export function scriptVisitas(opciones: { endpoint?: string } = {}): string {
  const endpoint = JSON.stringify(opciones.endpoint ?? '/api/visita');
  return (
    '(function(){var n=navigator,l=location,w=window,p;' +
    'if(w.__v||n.doNotTrack=="1"||w.doNotTrack=="1"||n.globalPrivacyControl===true||!n.sendBeacon)return;w.__v=1;' +
    'function s(){if(p==l.href)return;var r=p||document.referrer,q=new URLSearchParams(l.search),u={};p=l.href;' +
    '["source","medium","campaign"].forEach(function(k){var v=q.get("utm_"+k);if(v)u[k]=v});' +
    'try{r=new URL(r).origin}catch(e){r=""}' +
    `n.sendBeacon(${endpoint},new Blob([JSON.stringify({pagina:l.pathname,referente:r,utm:u,anchoPantalla:screen.width,sitio:l.hostname})],{type:"application/json"}))}` +
    'document.addEventListener("astro:page-load",s);' +
    'document.readyState=="complete"?s():w.addEventListener("load",s)})()'
  );
}

function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) usp.set(key, value);
  const query = usp.toString();
  return query ? `?${query}` : '';
}

async function errorFrom(res: Response): Promise<ErrorApiPlataforma> {
  let detalle: unknown;
  try {
    detalle = await res.json();
  } catch {
    detalle = undefined;
  }
  const mensaje =
    detalle && typeof detalle === 'object' && 'error' in detalle && typeof detalle.error === 'string'
      ? detalle.error
      : `Error ${res.status}`;
  const reintento = Number(res.headers.get('Retry-After'));
  return new ErrorApiPlataforma(
    res.status,
    mensaje,
    detalle,
    Number.isFinite(reintento) && reintento > 0 ? reintento : undefined,
  );
}

/** User-agent a ASCII sin cambiarlo en el caso común (casi todos lo son). */
function encodeURIComponentSafe(value: string): string {
  return /^[ -~]*$/.test(value) ? value : encodeURIComponent(value);
}

export function crearCliente(config: OpcionesCliente): Cliente {
  const base = config.url.replace(/\/+$/, '');
  const doFetch = config.fetch ?? fetch;

  function get(path: string): Promise<Response> {
    return doFetch(`${base}${path}`, { headers: { Authorization: `Bearer ${config.llave}` } });
  }

  async function getJson<T>(path: string): Promise<T> {
    const res = await get(path);
    if (!res.ok) throw await errorFrom(res);
    return res.json() as Promise<T>;
  }

  return {
    async version() {
      return (await getJson<{ version: number }>('/version')).version;
    },

    async bloques(paginas) {
      const qs = buildQuery({ paginas: paginas?.join(',') });
      return (await getJson<{ bloques: Record<string, Bloque> }>(`/bloques${qs}`)).bloques;
    },

    async coleccion(modulo: string, opciones: OpcionesColeccion = {}): Promise<never> {
      const usp = new URLSearchParams();
      if (opciones.pagina !== undefined) usp.set('pagina', String(opciones.pagina));
      if (opciones.porPagina !== undefined) usp.set('porPagina', String(opciones.porPagina));
      if (opciones.ordenarPor !== undefined) usp.set('ordenarPor', opciones.ordenarPor);
      if (opciones.formato !== undefined) usp.set('formato', opciones.formato);
      for (const [campo, valor] of Object.entries(opciones.filtro ?? {})) usp.set(`filtro[${campo}]`, valor);
      const query = usp.toString();
      return getJson(`/colecciones/${modulo}${query ? `?${query}` : ''}`);
    },

    async enviarFormulario(tipo, datos, opciones = {}) {
      const res = await doFetch(`${base}/formularios/${encodeURIComponent(tipo)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.llave}`,
          'Content-Type': 'application/json',
          ...(opciones.ip ? { 'X-Visitor-Ip': opciones.ip } : {}),
        },
        body: JSON.stringify({ datos, ...(opciones.pagina ? { pagina: opciones.pagina } : {}) }),
      });
      if (!res.ok) throw await errorFrom(res);
      return (await res.json()) as { id: string };
    },

    async registrarVisita(datos, opciones = {}) {
      const res = await doFetch(`${base}/visitas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.llave}`,
          'Content-Type': 'application/json',
          ...(opciones.ip ? { 'X-Visitor-Ip': opciones.ip } : {}),
          // Los encabezados HTTP son ASCII: el user-agent y la ciudad viajan tal cual o codificados.
          ...(opciones.ua ? { 'X-Visitor-UA': encodeURIComponentSafe(opciones.ua) } : {}),
          ...(opciones.country ? { 'X-Visitor-Country': opciones.country } : {}),
          ...(opciones.city ? { 'X-Visitor-City': encodeURIComponent(opciones.city) } : {}),
        },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw await errorFrom(res);
    },

    async elemento(modulo: string, slug: string, opciones: OpcionesElemento = {}): Promise<never | null> {
      const qs = buildQuery({ formato: opciones.formato });
      const res = await get(`/colecciones/${modulo}/${encodeURIComponent(slug)}${qs}`);
      if (res.status === 404) return null;
      if (!res.ok) throw await errorFrom(res);
      return res.json();
    },
  };
}
