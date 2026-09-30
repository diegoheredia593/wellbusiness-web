/**
 * POST /api/formularios/<tipo> — recibe un envío de "contacto" o "evaluacion-cobertura" y lo
 * reenvía a la plataforma (`POST /v1/formularios/:tipo`), donde llega a la bandeja "Formularios"
 * del portal de la agencia. La ruta vive en el propio sitio (el formulario llama al mismo
 * dominio que lo sirve), así que no hace falta CORS: en su lugar se exige que el `Origin` sea el
 * del propio sitio.
 *
 * Lo que se queda aquí (el navegador nunca habla con la plataforma ni ve la llave): la validación
 * de `Origin` y el señuelo anti-bots. Lo que pasó a la plataforma: la validación de campos y el
 * límite de envíos (5 por IP cada 15 minutos). La IP REAL del visitante (`cf-connecting-ip`) se
 * reenvía siempre: sin ella todos los visitantes compartirían el contador del servidor.
 */
import type { APIRoute } from 'astro';
import { plataforma } from '../../../lib/plataforma/cliente';
import { ErrorApiPlataforma } from '../../../lib/plataforma/sdk';
import { error, json } from '../../../lib/servidor/api';

/** Tipos de formulario que el sitio sabe enviar (los define la plataforma; deben coincidir con su clave). */
const TIPOS = new Set(['contacto', 'evaluacion-cobertura']);

/** La plataforma rechaza cuerpos de más de 64 KB; mejor cortar antes de gastar una llamada. */
const MAX_BYTES = 64 * 1024;

/**
 * Campo señuelo (honeypot): un bot que autorrellena formularios normalmente lo completa; una
 * persona real nunca lo ve (input oculto fuera de pantalla en ContactForm/EvaluationForm.astro).
 * Si llega con contenido, se responde éxito sin enviar nada — nunca se le dice al bot que fue detectado.
 */
const CAMPO_TRAMPA = 'sitioWeb';

/**
 * Mismo origen que la propia petición: cubre desarrollo local (cualquier puerto de `astro dev`) y
 * producción — Cloudflare enruta `idrocomsolutions.com` y `www.idrocomsolutions.com` al mismo
 * Worker, así que `url.origin` refleja el dominio que el visitante haya usado. Sin `Origin` se
 * rechaza: un navegador real siempre lo manda en un POST.
 */
function origenPermitido(request: Request, url: URL): boolean {
  const origen = request.headers.get('origin');
  return origen !== null && origen === url.origin;
}

/** Ruta de la página desde la que se envió (solo el path, sin dominio ni query), para la bandeja. */
function paginaDeOrigen(request: Request): string | undefined {
  const referer = request.headers.get('referer');
  if (!referer) return undefined;
  try {
    return new URL(referer).pathname.slice(0, 300);
  } catch {
    return undefined;
  }
}

export const POST: APIRoute = async ({ params, request, url }) => {
  if (!origenPermitido(request, url)) {
    return new Response('Origen no permitido.', { status: 403 });
  }

  const tipo = params.tipo ?? '';
  if (!TIPOS.has(tipo)) return error('Formulario no encontrado.', 404);

  const largo = Number(request.headers.get('content-length'));
  if (Number.isFinite(largo) && largo > MAX_BYTES) return error('El envío es demasiado grande.', 413);

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return error('No se pudo leer la información enviada.');
  }
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
    return error('No se pudo leer la información enviada.');
  }

  const { [CAMPO_TRAMPA]: trampa, ...resto } = crudo as Record<string, unknown>;
  if (typeof trampa === 'string' && trampa.trim() !== '') {
    return json({ ok: true });
  }

  // La plataforma solo acepta textos: todo lo que no sea texto se descarta aquí (un campo que
  // el tipo exige y falta dará su propio 422, con el error junto al campo).
  const datos: Record<string, string> = {};
  for (const [campo, valor] of Object.entries(resto)) {
    if (typeof valor === 'string') datos[campo] = valor;
  }

  try {
    await plataforma().enviarFormulario(tipo, datos, {
      ip: request.headers.get('cf-connecting-ip') ?? undefined,
      pagina: paginaDeOrigen(request),
    });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorApiPlataforma) {
      if (e.status === 422) {
        const campos: Record<string, string> = {};
        for (const { campo, mensaje } of e.errores) campos[campo || '_'] ??= mensaje;
        return error('Revisa los datos marcados.', 422, campos);
      }
      if (e.status === 429) {
        const respuesta = error(
          'Enviaste varias consultas seguidas desde esta conexión. Espera unos minutos e inténtalo de nuevo.',
          429,
        );
        if (e.reintentarEnSegundos) respuesta.headers.set('Retry-After', String(e.reintentarEnSegundos));
        return respuesta;
      }
      console.error(`La plataforma rechazó el formulario «${tipo}» (${e.status}): ${e.message}`);
    } else {
      console.error(`No se pudo enviar el formulario «${tipo}» a la plataforma.`, e);
    }
    return error('No pudimos enviar el formulario en este momento. Inténtalo de nuevo.', 502);
  }
};

export const prerender = false;
