/**
 * Envío de los formularios públicos (Fase 5) a `POST /api/formularios/<tipo>`.
 * Mismo origen que el propio sitio, sin CORS — ver esa ruta para el porqué.
 */
export interface RespuestaFormulario {
  ok: boolean;
  error?: string;
  campos?: Record<string, string>;
}

export async function enviarFormulario(tipo: string, datos: Record<string, string>): Promise<RespuestaFormulario> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/formularios/${tipo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo." };
  }

  const cuerpo = (await respuesta.json().catch(() => null)) as RespuestaFormulario | null;
  if (!respuesta.ok || !cuerpo?.ok) {
    return { ok: false, error: cuerpo?.error ?? "No se pudo enviar el formulario. Inténtalo de nuevo." };
  }
  return { ok: true };
}
