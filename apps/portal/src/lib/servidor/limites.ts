/**
 * Límite de intentos del portal: envuelve el límite genérico de
 * `@cms/core/limites` (Fase 5, promovido desde aquí — ver CAMBIOS-NUCLEO.md)
 * anteponiendo el prefijo "portal:" a cada clave.
 */
import { env } from 'cloudflare:workers';
import { ipDe, limitar as limitarBase } from '@cms/core/limites';

export { ipDe };

/** Registra un intento. Devuelve false si ya se superó el máximo en la ventana. */
export async function limitar(clave: string, maximo: number, ventanaSegundos: number): Promise<boolean> {
  return limitarBase(env.DB, `portal:${clave}`, maximo, ventanaSegundos);
}
