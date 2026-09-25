/**
 * Usuarios del portal. Se crean directamente en las tablas de Better Auth
 * (usuario + cuenta con contraseña), porque no hay registro público.
 */
import { and, eq, sql } from 'drizzle-orm';
import { db, esquema } from './db';
import { cifrarContrasena } from './contrasenas';
import type { Rol } from './tipos';

const { user, account, session } = esquema;

export const ROLES: Record<Rol, string> = { admin: 'Administrador', editor: 'Editor' };
export const esRol = (v: unknown): v is Rol => v === 'admin' || v === 'editor';

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function hayAdmin() {
  const fila = await db()
    .select({ n: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.role, 'admin'))
    .get();
  return (fila?.n ?? 0) > 0;
}

export async function buscarPorEmail(email: string) {
  return db().select().from(user).where(eq(user.email, normalizarEmail(email))).get();
}

export async function buscarPorId(id: string) {
  return db().select().from(user).where(eq(user.id, id)).get();
}

/** Crea usuario y cuenta con contraseña. Devuelve el id. */
export async function crearUsuario(datos: { nombre: string; email: string; contrasena: string; rol: Rol }) {
  const id = crypto.randomUUID();
  const ahora = new Date();
  const hash = await cifrarContrasena(datos.contrasena);
  await db().batch([
    db()
      .insert(user)
      .values({
        id,
        name: datos.nombre.trim(),
        email: normalizarEmail(datos.email),
        emailVerified: true,
        role: datos.rol,
        banned: false,
        createdAt: ahora,
        updatedAt: ahora,
      }),
    db().insert(account).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: 'credential',
      userId: id,
      password: hash,
      createdAt: ahora,
      updatedAt: ahora,
    }),
  ]);
  return id;
}

/** Cambia la contraseña y cierra todas las sesiones del usuario. */
export async function cambiarContrasena(usuarioId: string, contrasena: string) {
  const hash = await cifrarContrasena(contrasena);
  await db().batch([
    db()
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(and(eq(account.userId, usuarioId), eq(account.providerId, 'credential'))),
    db().delete(session).where(eq(session.userId, usuarioId)),
  ]);
}

export async function listarUsuarios() {
  return db()
    .select({
      id: user.id,
      nombre: user.name,
      email: user.email,
      rol: user.role,
      banned: user.banned,
      creado: user.createdAt,
      ultimaSesion: sql<number | null>`(select max(s.updated_at) from session s where s.user_id = "user"."id")`,
    })
    .from(user)
    .orderBy(user.name)
    .all();
}

export async function cambiarRol(usuarioId: string, rol: Rol) {
  await db().update(user).set({ role: rol, updatedAt: new Date() }).where(eq(user.id, usuarioId));
}

export async function cambiarActivo(usuarioId: string, activo: boolean) {
  await db().batch([
    db()
      .update(user)
      .set({ banned: !activo, banReason: activo ? null : 'Desactivado desde el portal', updatedAt: new Date() })
      .where(eq(user.id, usuarioId)),
    ...(activo ? [] : [db().delete(session).where(eq(session.userId, usuarioId))]),
  ] as unknown as Parameters<ReturnType<typeof db>['batch']>[0]);
}

/** Cuántos admins activos hay (para no dejar el portal sin administrador). */
export async function adminsActivos() {
  const fila = await db()
    .select({ n: sql<number>`count(*)` })
    .from(user)
    .where(and(eq(user.role, 'admin'), sql`coalesce(${user.banned}, 0) = 0`))
    .get();
  return fila?.n ?? 0;
}
