/**
 * Aplica las migraciones pendientes desde el propio Worker, usando el binding
 * de D1. Así no hace falta correr comandos ni crear tokens de API: al
 * desplegar una versión nueva del portal, la primera visita aplica lo que falte.
 *
 * Los archivos SQL los genera drizzle-kit en `packages/cms-core/migraciones`.
 */

/** Lo mínimo que necesitamos del binding de D1. */
export interface SentenciaMinima {
  bind(...valores: unknown[]): SentenciaMinima;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface D1Minimo {
  prepare(sql: string): SentenciaMinima;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batch(sentencias: any[]): Promise<unknown[]>;
  exec(sql: string): Promise<unknown>;
}

const archivos = import.meta.glob('../../migraciones/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Migraciones en orden: [nombre, sentencias]. */
export const MIGRACIONES: [string, string[]][] = Object.entries(archivos)
  .map(([ruta, sql]): [string, string[]] => [
    ruta.split('/').pop()!.replace(/\.sql$/, ''),
    sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean),
  ])
  .sort(([a], [b]) => a.localeCompare(b));

let aplicadas: Promise<void> | null = null;

/** Aplica una vez por instancia del Worker. Seguro de llamar en cada petición. */
export function asegurarMigraciones(db: D1Minimo): Promise<void> {
  aplicadas ??= aplicar(db).catch((e) => {
    aplicadas = null; // reintentar en la próxima petición
    throw e;
  });
  return aplicadas;
}

async function aplicar(db: D1Minimo) {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS _migraciones (nombre TEXT PRIMARY KEY NOT NULL, aplicada TEXT NOT NULL)',
  );
  const { results } = await db.prepare('SELECT nombre FROM _migraciones').all<{ nombre: string }>();
  const hechas = new Set(results.map((r) => r.nombre));
  for (const [nombre, sentencias] of MIGRACIONES) {
    if (hechas.has(nombre)) continue;
    // Una migración entera es una transacción (batch). Si otra instancia la
    // aplicó al mismo tiempo, el batch falla y se comprueba de nuevo.
    try {
      await db.batch([
        ...sentencias.map((s) => db.prepare(s)),
        db.prepare('INSERT INTO _migraciones (nombre, aplicada) VALUES (?, ?)').bind(nombre, new Date().toISOString()),
      ]);
    } catch (e) {
      const { results: otra } = await db
        .prepare('SELECT nombre FROM _migraciones WHERE nombre = ?')
        .bind(nombre)
        .all<{ nombre: string }>()
        .catch(() => ({ results: [] }));
      if (!otra.length) throw e;
    }
  }
}
