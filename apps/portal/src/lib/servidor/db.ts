import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as esquema from '@cms/core/db';
import { asegurarMigraciones } from '@cms/core/migraciones';
import { asegurarDefiniciones } from './sincronizar';

export type BaseDatos = ReturnType<typeof crearDb>;

function crearDb() {
  return drizzle(env.DB, { schema: esquema });
}

let instancia: BaseDatos | null = null;

/** Base de datos del portal. */
export function db(): BaseDatos {
  instancia ??= crearDb();
  return instancia;
}

/** Deja la base lista: migraciones aplicadas y definiciones de bloques sincronizadas. */
export async function prepararBase() {
  await asegurarMigraciones(env.DB);
  await asegurarDefiniciones();
}

export { esquema };

/** Convierte una consulta de Drizzle en sentencia de D1 para mezclarla en un batch. */
export function toD1(consulta: { toSQL(): { sql: string; params: unknown[] } }): D1PreparedStatement {
  const { sql, params } = consulta.toSQL();
  return env.DB.prepare(sql).bind(...params);
}
