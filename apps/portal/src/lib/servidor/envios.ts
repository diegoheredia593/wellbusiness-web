/** Envíos de los formularios del sitio (el sitio empezará a guardarlos en la fase 3). */
import { env } from 'cloudflare:workers';
import cliente from '@cliente';

export interface Envio {
  id: string;
  tipo: string;
  datos: Record<string, string>;
  creado: string;
  leidoEn: string | null;
  esEjemplo: boolean;
}

interface Fila {
  id: string;
  tipo: string;
  datos: string;
  creado: string;
  leido_en: string | null;
  es_ejemplo: number;
}

const aEnvio = (f: Fila): Envio => ({
  id: f.id,
  tipo: f.tipo,
  datos: JSON.parse(f.datos) as Record<string, string>,
  creado: f.creado,
  leidoEn: f.leido_en,
  esEjemplo: f.es_ejemplo === 1,
});

export async function contarPorTipo() {
  const { results } = await env.DB.prepare(
    `SELECT tipo, count(*) AS total, sum(CASE WHEN leido_en IS NULL THEN 1 ELSE 0 END) AS sin_leer
     FROM envios_formulario GROUP BY tipo`,
  ).all<{ tipo: string; total: number; sin_leer: number }>();
  return Object.keys(cliente.formularios).map((tipo) => {
    const f = results.find((r) => r.tipo === tipo);
    return { tipo, etiqueta: cliente.formularios[tipo]!.etiqueta, total: f?.total ?? 0, sinLeer: f?.sin_leer ?? 0 };
  });
}

export async function listarEnvios(tipo: string, limite = 200) {
  const { results } = await env.DB.prepare(
    'SELECT id, tipo, datos, creado, leido_en, es_ejemplo FROM envios_formulario WHERE tipo = ? ORDER BY creado DESC LIMIT ?',
  )
    .bind(tipo, limite)
    .all<Fila>();
  return results.map(aEnvio);
}

export async function marcarLeido(id: string, leido: boolean) {
  const r = await env.DB.prepare(
    `UPDATE envios_formulario SET leido_en = ${leido ? "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" : 'NULL'} WHERE id = ? RETURNING tipo`,
  )
    .bind(id)
    .first<{ tipo: string }>();
  return r?.tipo ?? null;
}

export async function borrarEnvio(id: string) {
  const r = await env.DB.prepare('DELETE FROM envios_formulario WHERE id = ? RETURNING tipo').bind(id).first<{ tipo: string }>();
  return r?.tipo ?? null;
}

/** Valor legible (p. ej. motivo "donar" → "Donar"). */
export function valorLegible(tipo: string, campo: string, valor: string) {
  return cliente.formularios[tipo]?.opciones?.[campo]?.[valor] ?? valor;
}

/** CSV con separador ";" y BOM, para que Excel en español lo abra bien. */
export async function csv(tipo: string) {
  const def = cliente.formularios[tipo];
  if (!def) return null;
  const envios = await listarEnvios(tipo, 10000);
  const campos = Object.keys(def.campos);
  const celda = (v: string) => {
    // Evita que Excel ejecute fórmulas escritas en el formulario.
    const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  const zona = cliente.portal.zonaHoraria;
  const fecha = (iso: string) =>
    new Intl.DateTimeFormat('es-EC', { timeZone: zona, dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  const filas = [
    ['Fecha', ...campos.map((c) => def.campos[c]!), 'Leído', 'Ejemplo'].map(celda).join(';'),
    ...envios.map((e) =>
      [
        fecha(e.creado),
        ...campos.map((c) => valorLegible(tipo, c, e.datos[c] ?? '')),
        e.leidoEn ? 'Sí' : 'No',
        e.esEjemplo ? 'Sí' : 'No',
      ]
        .map(celda)
        .join(';'),
    ),
  ];
  return `﻿${filas.join('\r\n')}\r\n`;
}
