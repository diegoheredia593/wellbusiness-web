/**
 * Autenticación con Better Auth sobre D1.
 *
 * - Solo correo y contraseña, sin registro público (los usuarios los crea un
 *   admin con enlaces de invitación).
 * - Roles con el plugin admin: `admin` y `editor`. `banned` = desactivado.
 * - Cookies seguras (HttpOnly, Secure, SameSite=Lax), sesiones de 7 días que
 *   se renuevan con el uso, límite de intentos guardado en D1.
 */
import { env } from 'cloudflare:workers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { tablasAuth } from '@cms/core/db';
import { db } from './db';
import { cifrarContrasena, LONGITUD_MAXIMA, LONGITUD_MINIMA, verificarContrasena } from './contrasenas';
import { limitar } from './limites';

const DIA = 60 * 60 * 24;

/** Rutas de Better Auth que el portal usa; el resto queda deshabilitado. */
export const RUTAS_AUTH_PERMITIDAS = ['/sign-in/email', '/sign-out', '/get-session', '/change-password'];

function crear(origen: string) {
  const secreto = env.BETTER_AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error('Falta el secreto BETTER_AUTH_SECRET (mínimo 32 caracteres) en las variables del Worker.');
  }
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen);
  return betterAuth({
    appName: 'Portal',
    baseURL: origen,
    basePath: '/api/auth',
    secret: secreto,
    trustedOrigins: [origen],
    database: drizzleAdapter(db(), { provider: 'sqlite', schema: tablasAuth }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: LONGITUD_MINIMA,
      maxPasswordLength: LONGITUD_MAXIMA,
      revokeSessionsOnPasswordReset: true,
      password: { hash: cifrarContrasena, verify: verificarContrasena },
    },
    session: {
      expiresIn: 7 * DIA,
      updateAge: DIA,
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/change-password': { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: !local,
      cookiePrefix: 'portal',
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      database: { generateId: () => crypto.randomUUID() },
    },
    telemetry: { enabled: false },
    plugins: [admin({ defaultRole: 'editor', adminRoles: ['admin'] })],
    hooks: {
      // Además del límite por IP: máximo 10 intentos por correo cada 15 minutos.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;
        const email = String((ctx.body as { email?: unknown } | undefined)?.email ?? '').toLowerCase();
        if (!email) return;
        const permitido = await limitar(`login:${email}`, 10, 15 * 60);
        if (!permitido) {
          throw new APIError('TOO_MANY_REQUESTS', {
            message: 'Demasiados intentos con este correo. Espera 15 minutos e inténtalo de nuevo.',
          });
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof crear>;
const porOrigen = new Map<string, Auth>();

/** Instancia de Better Auth para el origen de la petición (se reutiliza). */
export function auth(origen: string): Auth {
  let a = porOrigen.get(origen);
  if (!a) {
    a = crear(origen);
    porOrigen.set(origen, a);
  }
  return a;
}
