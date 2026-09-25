/**
 * Límite de intentos simple (ventana fija) guardado en D1, en la misma tabla
 * que usa Better Auth. Las claves del portal empiezan con "portal:".
 */
import { env } from 'cloudflare:workers';

/** Registra un intento. Devuelve false si ya se superó el máximo en la ventana. */
export async function limitar(clave: string, maximo: number, ventanaSegundos: number): Promise<boolean> {
  const ahora = Date.now();
  const key = `portal:${clave}`;
  const fila = await env.DB.prepare(
    `INSERT INTO rate_limit (id, key, count, last_request) VALUES (?, ?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN last_request < ?4 THEN 1 ELSE count + 1 END,
       last_request = CASE WHEN last_request < ?4 THEN ?3 ELSE last_request END
     RETURNING count`,
  )
    .bind(crypto.randomUUID(), key, ahora, ahora - ventanaSegundos * 1000)
    .first<{ count: number }>();
  return (fila?.count ?? 0) <= maximo;
}

/** IP del visitante (Cloudflare). */
export function ipDe(request: Request) {
  return request.headers.get('cf-connecting-ip') ?? 'local';
}
