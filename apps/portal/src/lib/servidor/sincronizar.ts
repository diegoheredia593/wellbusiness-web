/**
 * Sincroniza los metadatos de los bloques (código → base).
 *
 * Las definiciones viven en la configuración del cliente. La base guarda una
 * copia de los metadatos (útil para consultas y para la fase 3) y el valor.
 * - Un bloque nuevo en el código se inserta con su valor inicial.
 * - Un bloque existente solo actualiza sus metadatos; su valor no se toca.
 * - Solo se ejecuta cuando cambian las definiciones (se guarda una huella).
 *
 * Todo va en una sola consulta (json_each) para respetar el límite de 50
 * consultas por petición del plan gratis de Workers.
 */
import { env } from 'cloudflare:workers';
import cliente from '@cliente';

let hecho: Promise<void> | null = null;

export function asegurarDefiniciones(): Promise<void> {
  hecho ??= sincronizar().catch((e) => {
    hecho = null;
    throw e;
  });
  return hecho;
}

async function huella(texto: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sincronizar() {
  const filas = cliente.bloques.map((b) => ({
    key: b.key,
    pagina: b.pagina,
    seccion: b.seccion,
    etiqueta: b.etiqueta,
    tipo: b.tipo,
    nivel: b.nivel,
    max_length: b.maxLength,
    obligatorio: b.obligatorio ? 1 : 0,
    valor: b.valor === null ? null : JSON.stringify(b.valor),
  }));
  const metadatos = JSON.stringify(filas.map(({ valor: _v, ...m }) => m));
  const actual = await huella(metadatos);

  const guardada = await env.DB.prepare("SELECT valor FROM ajustes_internos WHERE clave = 'huella_bloques'").first<{
    valor: string;
  }>();
  if (guardada?.valor === actual) return;

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO bloques (key, pagina, seccion, etiqueta, tipo, nivel, max_length, obligatorio, valor)
       SELECT j.value ->> '$.key', j.value ->> '$.pagina', j.value ->> '$.seccion', j.value ->> '$.etiqueta',
              j.value ->> '$.tipo', j.value ->> '$.nivel', j.value ->> '$.max_length', j.value ->> '$.obligatorio',
              j.value ->> '$.valor'
       FROM json_each(?) AS j WHERE true
       ON CONFLICT(key) DO UPDATE SET
         pagina = excluded.pagina, seccion = excluded.seccion, etiqueta = excluded.etiqueta,
         tipo = excluded.tipo, nivel = excluded.nivel, max_length = excluded.max_length,
         obligatorio = excluded.obligatorio`,
    ).bind(JSON.stringify(filas)),
    env.DB.prepare(
      "INSERT INTO ajustes_internos (clave, valor) VALUES ('huella_bloques', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
    ).bind(actual),
  ]);
}
