/**
 * Cifrado de contraseñas con PBKDF2-SHA256 nativo (WebCrypto).
 *
 * Better Auth usa scrypt en JavaScript por defecto, que en el plan gratis de
 * Workers (10 ms de CPU por petición) suele pasarse del límite. PBKDF2 corre
 * en código nativo del runtime. El número de iteraciones queda guardado en
 * cada hash, así se puede subir más adelante (variable PASSWORD_ITERATIONS)
 * sin invalidar las contraseñas existentes.
 *
 * Formato: pbkdf2-sha256$<iteraciones>$<sal base64>$<hash base64>
 */
import { env } from 'cloudflare:workers';

const ITERACIONES_POR_DEFECTO = 50_000;
const BYTES_HASH = 32;

function aBase64(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function desdeBase64(texto: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));
}

async function derivar(contrasena: string, sal: Uint8Array<ArrayBuffer>, iteraciones: number) {
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena.normalize('NFKC')), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones },
    clave,
    BYTES_HASH * 8,
  );
  return new Uint8Array(bits);
}

function iteracionesConfiguradas() {
  const n = Number(env.PASSWORD_ITERATIONS);
  return Number.isInteger(n) && n >= 10_000 ? n : ITERACIONES_POR_DEFECTO;
}

export async function cifrarContrasena(contrasena: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iteraciones = iteracionesConfiguradas();
  const hash = await derivar(contrasena, sal, iteraciones);
  return `pbkdf2-sha256$${iteraciones}$${aBase64(sal)}$${aBase64(hash)}`;
}

export async function verificarContrasena({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [algoritmo, iter, sal, esperado] = hash.split('$');
  if (algoritmo !== 'pbkdf2-sha256' || !iter || !sal || !esperado) return false;
  const obtenido = await derivar(password, desdeBase64(sal), Number(iter));
  return iguales(obtenido, desdeBase64(esperado));
}

/** Comparación en tiempo constante. */
export function iguales(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export const LONGITUD_MINIMA = 10;
export const LONGITUD_MAXIMA = 128;

/** Mensaje de error si la contraseña no sirve, o null. */
export function problemaContrasena(contrasena: unknown): string | null {
  if (typeof contrasena !== 'string') return 'Escribe una contraseña.';
  if (contrasena.length < LONGITUD_MINIMA) return `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
  if (contrasena.length > LONGITUD_MAXIMA) return `La contraseña puede tener como máximo ${LONGITUD_MAXIMA} caracteres.`;
  return null;
}
