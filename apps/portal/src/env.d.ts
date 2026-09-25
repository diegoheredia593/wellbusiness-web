/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    /** Secreto de Better Auth (firma de cookies y tokens). Obligatorio. */
    BETTER_AUTH_SECRET?: string;
    /** Clave de la configuración inicial (crear el primer admin). */
    SETUP_SECRET?: string;
    /** Iteraciones de PBKDF2 para contraseñas nuevas (opcional). */
    PASSWORD_ITERATIONS?: string;
  }
}

declare namespace App {
  interface Locals {
    usuario: import('./lib/servidor/tipos').UsuarioSesion | null;
  }
}
