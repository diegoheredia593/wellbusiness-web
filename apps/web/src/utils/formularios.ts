/**
 * Envío de los formularios públicos a `POST /api/formularios/<tipo>` (la ruta del propio sitio,
 * que reenvía a la plataforma — ver esa ruta). Mismo origen, sin CORS.
 */
export interface RespuestaFormulario {
  ok: boolean;
  error?: string;
  /** En un 422: el mensaje de la plataforma por campo (la clave `_` es un error general). */
  campos?: Record<string, string>;
  /** Código HTTP cuando la respuesta llegó (429 = demasiados envíos). */
  status?: number;
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
    return {
      ok: false,
      status: respuesta.status,
      error: cuerpo?.error ?? "No se pudo enviar el formulario. Inténtalo de nuevo.",
      ...(cuerpo?.campos ? { campos: cuerpo.campos } : {}),
    };
  }
  return { ok: true };
}

const ATRIBUTO_ERROR = "data-error-campo";

/** Quita los errores por campo de un intento anterior. */
export function limpiarErroresDeCampos(form: HTMLFormElement): void {
  form.querySelectorAll(`[${ATRIBUTO_ERROR}]`).forEach((el) => el.remove());
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

/**
 * Pinta los errores 422 junto a cada campo. Devuelve los mensajes que NO pudo ubicar junto a un
 * campo (un campo que el formulario no tiene, o el error general `_`), para mostrarlos en el
 * aviso general en vez de perderlos.
 */
export function mostrarErroresDeCampos(form: HTMLFormElement, campos: Record<string, string>): string[] {
  const sinCampo: string[] = [];
  for (const [nombre, mensaje] of Object.entries(campos)) {
    const control = nombre === "_" ? null : form.elements.namedItem(nombre);
    if (!(control instanceof HTMLElement)) {
      sinCampo.push(mensaje);
      continue;
    }
    const id = `${control.id || nombre}-error`;
    const aviso = document.createElement("p");
    aviso.id = id;
    aviso.setAttribute(ATRIBUTO_ERROR, nombre);
    aviso.setAttribute("role", "alert");
    aviso.className = "mt-1.5 text-sm font-medium text-brand-red";
    aviso.textContent = mensaje;
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", id);
    control.insertAdjacentElement("afterend", aviso);
  }
  return sinCampo;
}

/**
 * Decide qué mostrar cuando el envío falló: errores junto a cada campo (422), un mensaje claro
 * para el límite de envíos (429), o el aviso general de siempre. `bloque` es el contenedor
 * "No pudimos enviar…" (su texto por defecto se restaura en el siguiente intento).
 */
export function mostrarFalloDeEnvio(
  form: HTMLFormElement,
  bloque: HTMLElement | null,
  resultado: RespuestaFormulario,
): void {
  const aviso = bloque?.querySelector("p") ?? null;
  if (aviso && !aviso.dataset.textoOriginal) aviso.dataset.textoOriginal = aviso.textContent ?? "";

  let mensaje: string | null = null;
  if (resultado.status === 422 && resultado.campos) {
    const sinCampo = mostrarErroresDeCampos(form, resultado.campos);
    if (sinCampo.length === 0) {
      // Todo quedó junto a su campo: no hace falta el aviso general; llevar el foco al primero.
      const primero = form.querySelector<HTMLElement>("[aria-invalid]");
      primero?.focus({ preventScroll: true });
      // Centrado: con el encabezado fijo, el scroll por defecto del foco deja el mensaje tapado.
      primero?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    mensaje = sinCampo.join(" ");
  } else if (resultado.status === 429) {
    mensaje = resultado.error ?? null;
  }

  if (aviso && mensaje) aviso.textContent = mensaje;
  bloque?.classList.remove("hidden");
}

/** Deja el aviso general como estaba antes de un fallo con mensaje propio. */
export function restaurarAvisoDeEnvio(bloque: HTMLElement | null): void {
  const aviso = bloque?.querySelector("p");
  if (aviso?.dataset.textoOriginal) aviso.textContent = aviso.dataset.textoOriginal;
}
