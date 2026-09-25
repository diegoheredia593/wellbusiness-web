/**
 * Enlaces de un solo uso con vencimiento: invitaciones y restablecimiento de
 * contraseña. En la base solo se guarda el SHA-256 del token.
 *
 * `EnviadorEnlaces` es el punto de extensión para la fase 3: hoy el enlace se
 * muestra al admin para copiarlo o mandarlo por WhatsApp; con correo se agrega
 * otro enviador sin tocar el resto.
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, esquema } from './db';
import type { Rol } from './tipos';

const { enlaces } = esquema;

export type TipoEnlace = 'invitacion' | 'restablecer';

export const VIGENCIA_HORAS: Record<TipoEnlace, number> = { invitacion: 72, restablecer: 24 };

export interface EnlaceGenerado {
  id: string;
  url: string;
  vence: string;
  email: string;
  nombre: string | null;
  tipo: TipoEnlace;
}

export interface EnviadorEnlaces {
  /** Canal de envío, para mostrarlo al admin. */
  canal: 'manual' | 'correo';
  enviar(enlace: EnlaceGenerado): Promise<void>;
}

/** Fase 2: no se envía nada; el admin copia el enlace o lo manda por WhatsApp. */
export const enviadorManual: EnviadorEnlaces = { canal: 'manual', async enviar() {} };

function tokenAleatorio() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashToken(token: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function crearEnlace(
  origen: string,
  datos: {
    tipo: TipoEnlace;
    email: string;
    nombre?: string | null;
    rol?: Rol | null;
    usuarioId?: string | null;
    creadoPor: string;
  },
): Promise<EnlaceGenerado> {
  const token = tokenAleatorio();
  const id = crypto.randomUUID();
  const vence = new Date(Date.now() + VIGENCIA_HORAS[datos.tipo] * 3600_000).toISOString();
  // Un enlace nuevo anula los anteriores sin usar para el mismo correo y tipo.
  await db().batch([
    db()
      .update(enlaces)
      .set({ vence: new Date().toISOString() })
      .where(and(eq(enlaces.email, datos.email), eq(enlaces.tipo, datos.tipo), isNull(enlaces.usadoEn))),
    db()
      .insert(enlaces)
      .values({
        id,
        tipo: datos.tipo,
        tokenHash: await hashToken(token),
        email: datos.email,
        nombre: datos.nombre ?? null,
        rol: datos.rol ?? null,
        usuarioId: datos.usuarioId ?? null,
        vence,
        creadoPor: datos.creadoPor,
      }),
  ]);
  const generado: EnlaceGenerado = {
    id,
    url: `${origen}/${datos.tipo}/${token}`,
    vence,
    email: datos.email,
    nombre: datos.nombre ?? null,
    tipo: datos.tipo,
  };
  await enviadorManual.enviar(generado);
  return generado;
}

export type EstadoEnlace =
  | { valido: true; enlace: typeof enlaces.$inferSelect }
  | { valido: false; motivo: 'no-existe' | 'usado' | 'vencido' };

export async function comprobarEnlace(tipo: TipoEnlace, token: string): Promise<EstadoEnlace> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { valido: false, motivo: 'no-existe' };
  const enlace = await db()
    .select()
    .from(enlaces)
    .where(and(eq(enlaces.tokenHash, await hashToken(token)), eq(enlaces.tipo, tipo)))
    .get();
  if (!enlace) return { valido: false, motivo: 'no-existe' };
  if (enlace.usadoEn) return { valido: false, motivo: 'usado' };
  if (enlace.vence <= new Date().toISOString()) return { valido: false, motivo: 'vencido' };
  return { valido: true, enlace };
}

/** Marca el enlace como usado. Devuelve false si otro lo usó primero. */
export async function marcarUsado(id: string) {
  const r = await db()
    .update(enlaces)
    .set({ usadoEn: new Date().toISOString() })
    .where(and(eq(enlaces.id, id), isNull(enlaces.usadoEn)))
    .returning({ id: enlaces.id });
  return r.length === 1;
}

/** Invitaciones pendientes (sin usar y sin vencer). */
export async function invitacionesPendientes() {
  const ahora = new Date().toISOString();
  const filas = await db()
    .select()
    .from(enlaces)
    .where(and(eq(enlaces.tipo, 'invitacion'), isNull(enlaces.usadoEn)))
    .orderBy(desc(enlaces.creado))
    .all();
  return filas.filter((f) => f.vence > ahora);
}

export async function anularEnlace(id: string) {
  await db().update(enlaces).set({ vence: new Date().toISOString() }).where(eq(enlaces.id, id));
}
