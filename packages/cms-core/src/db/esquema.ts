/**
 * Esquema de la base de datos (Cloudflare D1 / SQLite) del CMS.
 *
 * Es genérico: sirve para cualquier cliente sin crear tablas nuevas. Las
 * definiciones de bloques y los esquemas de colecciones viven en el código
 * (configuración del cliente); la base solo guarda valores.
 *
 * Cambios: editar este archivo y generar una migración nueva con
 * `npm run db:generar -w @cms/core`. El portal aplica las migraciones
 * pendientes solo, al arrancar.
 */
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/** Fecha y hora actual en ISO 8601 (UTC), generada por SQLite. */
const ahoraIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// ─── Contenido ─────────────────────────────────────────────────────────────

/**
 * Bloques fijos. Los metadatos (página, sección, etiqueta, tipo, nivel,
 * límite, obligatorio) son una copia de la definición en código, que el portal
 * sincroniza al arrancar; la fuente de verdad es la configuración del cliente.
 */
export const bloques = sqliteTable(
  'bloques',
  {
    key: text('key').primaryKey(),
    pagina: text('pagina').notNull(),
    seccion: text('seccion').notNull(),
    etiqueta: text('etiqueta').notNull(),
    tipo: text('tipo').notNull(),
    nivel: text('nivel', { enum: ['contenido', 'sistema'] }).notNull(),
    maxLength: integer('max_length'),
    obligatorio: integer('obligatorio', { mode: 'boolean' }).notNull(),
    /** Valor publicado (JSON). `null` = vacío. */
    valor: text('valor', { mode: 'json' }),
    /** Valor en revisión (modo "requiere aprobación"). `null` = sin cambios pendientes. */
    valorBorrador: text('valor_borrador', { mode: 'json' }),
    actualizado: text('actualizado').notNull().default(ahoraIso),
    actualizadoPor: text('actualizado_por'),
  },
  (t) => [index('bloques_pagina').on(t.pagina)],
);

/** Ítems de todas las colecciones. `datos` se valida con el esquema Zod de la colección. */
export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    coleccion: text('coleccion').notNull(),
    /** Copia del campo de dirección (si la colección tiene), para que sea única. */
    slug: text('slug'),
    estado: text('estado', { enum: ['borrador', 'publicado', 'archivado'] }).notNull(),
    orden: integer('orden').notNull(),
    datos: text('datos', { mode: 'json' }).notNull(),
    /** Cambios en revisión sobre un ítem publicado (modo "requiere aprobación"). */
    datosBorrador: text('datos_borrador', { mode: 'json' }),
    creado: text('creado').notNull().default(ahoraIso),
    actualizado: text('actualizado').notNull().default(ahoraIso),
    /** Papelera: fecha en que se eliminó. Pasados 30 días se borra definitivamente. */
    eliminadoEn: text('eliminado_en'),
    autor: text('autor'),
  },
  (t) => [
    index('items_coleccion').on(t.coleccion, t.eliminadoEn, t.estado, t.orden),
    // Una dirección no se repite dentro de una colección (salvo en la papelera).
    uniqueIndex('items_slug_unico').on(t.coleccion, t.slug).where(sql`slug is not null and eliminado_en is null`),
  ],
);

/** Biblioteca de fotos. El archivo vive en R2 bajo `clave`. */
export const medios = sqliteTable('medios', {
  id: text('id').primaryKey(),
  clave: text('clave').notNull().unique(),
  nombreOriginal: text('nombre_original').notNull(),
  tipo: text('tipo').notNull(),
  ancho: integer('ancho').notNull(),
  alto: integer('alto').notNull(),
  peso: integer('peso').notNull(),
  alt: text('alt').notNull(),
  subidoPor: text('subido_por'),
  creado: text('creado').notNull().default(ahoraIso),
});

/** Historial legible de cambios. */
export const auditoria = sqliteTable(
  'auditoria',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    usuarioId: text('usuario_id'),
    /** Nombre del usuario al momento del cambio (sobrevive si se borra el usuario). */
    usuarioNombre: text('usuario_nombre').notNull(),
    accion: text('accion').notNull(),
    objetoTipo: text('objeto_tipo').notNull(),
    objetoId: text('objeto_id'),
    /** Nombre legible del objeto (p. ej. el título de la noticia). */
    objetoNombre: text('objeto_nombre'),
    /** Colección o página a la que pertenece el objeto. */
    contexto: text('contexto'),
    resumen: text('resumen'),
    creado: text('creado').notNull().default(ahoraIso),
  },
  (t) => [index('auditoria_creado').on(t.creado)],
);

/** Envíos de los formularios del sitio. El sitio empezará a guardar aquí en la fase 3. */
export const enviosFormulario = sqliteTable(
  'envios_formulario',
  {
    id: text('id').primaryKey(),
    tipo: text('tipo').notNull(),
    datos: text('datos', { mode: 'json' }).notNull(),
    creado: text('creado').notNull().default(ahoraIso),
    leidoEn: text('leido_en'),
    /** Datos de ejemplo cargados por el portal (se pueden borrar). */
    esEjemplo: integer('es_ejemplo', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('envios_tipo').on(t.tipo, t.creado)],
);

/** Enlaces de un solo uso: invitaciones y restablecimiento de contraseña. */
export const enlaces = sqliteTable('enlaces', {
  id: text('id').primaryKey(),
  tipo: text('tipo', { enum: ['invitacion', 'restablecer'] }).notNull(),
  /** SHA-256 del token; el token en claro solo existe en el enlace. */
  tokenHash: text('token_hash').notNull().unique(),
  email: text('email').notNull(),
  nombre: text('nombre'),
  rol: text('rol'),
  usuarioId: text('usuario_id'),
  vence: text('vence').notNull(),
  usadoEn: text('usado_en'),
  creadoPor: text('creado_por'),
  creado: text('creado').notNull().default(ahoraIso),
});

/** Ajustes internos del portal (p. ej. huella de las definiciones sincronizadas). */
export const ajustesInternos = sqliteTable('ajustes_internos', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
});

// ─── Autenticación (tablas de Better Auth) ─────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  /** `admin` | `editor` */
  role: text('role'),
  /** Usuario desactivado: no puede entrar. */
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (t) => [index('session_user').on(t.userId)],
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [index('account_user').on(t.userId)],
);

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rateLimit = sqliteTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('last_request').notNull(),
});

export const tablasAuth = { user, session, account, verification, rateLimit };
