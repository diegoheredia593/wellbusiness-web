/**
 * Almacén de medios del cliente activo (KV o R2, según su configuración).
 * El resto del portal solo usa esta función.
 */
import { env } from 'cloudflare:workers';
import cliente from '@cliente';
import { crearAlmacen, type AlmacenMedios } from '@cms/core/almacen';

let almacen: AlmacenMedios | undefined;

export function almacenMedios(): AlmacenMedios {
  almacen ??= crearAlmacen(cliente.portal.almacenamiento.tipo, (env as unknown as { MEDIOS?: unknown }).MEDIOS);
  return almacen;
}

/**
 * Cache API de Cloudflare, si existe. En *.workers.dev no guarda nada; con
 * dominio propio evita leer el almacén en cada visita.
 */
export function cacheDisponible(): Cache | null {
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default ?? null;
  } catch {
    return null;
  }
}
