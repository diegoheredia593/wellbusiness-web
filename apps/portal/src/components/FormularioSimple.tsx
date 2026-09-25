/**
 * Formulario sencillo para las pantallas públicas (entrar, configuración
 * inicial, invitación, restablecer). Envía JSON y muestra los errores junto
 * a cada campo.
 */
import { useId, useRef, useState, type FormEvent } from 'react';

export interface CampoSimple {
  nombre: string;
  etiqueta: string;
  tipo?: 'text' | 'email' | 'password';
  autocomplete?: string;
  ayuda?: string;
  valor?: string;
  soloLectura?: boolean;
}

interface Props {
  campos: CampoSimple[];
  endpoint: string;
  boton: string;
  /** Adónde ir cuando sale bien. */
  destino: string;
  /** Datos extra que se envían siempre. */
  extra?: Record<string, unknown>;
  /** Mensaje de éxito antes de redirigir (opcional). */
  exito?: string;
}

function mensajeDe(respuesta: unknown, status: number): string {
  const r = respuesta as { error?: string; message?: string; code?: string } | null;
  if (r?.error) return r.error;
  if (r?.code === 'INVALID_EMAIL_OR_PASSWORD') return 'El correo o la contraseña no son correctos.';
  if (r?.code === 'BANNED_USER') return 'Tu usuario está desactivado. Habla con el administrador.';
  if (r?.code === 'INVALID_PASSWORD') return 'La contraseña actual no es correcta.';
  if (r?.code === 'PASSWORD_TOO_SHORT') return 'La contraseña nueva debe tener al menos 10 caracteres.';
  if (r?.code === 'PASSWORD_TOO_LONG') return 'La contraseña nueva es demasiado larga.';
  if (status === 429)
    return r?.message && /[áéíóú]|Espera/.test(r.message)
      ? r.message
      : 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
  return 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.';
}

export default function FormularioSimple({ campos, endpoint, boton, destino, extra, exito }: Props) {
  const id = useId();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const refGeneral = useRef<HTMLDivElement>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setGeneral(null);
    setErrores({});
    const datos = { ...extra, ...Object.fromEntries(new FormData(e.currentTarget).entries()) };
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const cuerpo = await r.json().catch(() => null);
      if (!r.ok) {
        setErrores((cuerpo as { campos?: Record<string, string> } | null)?.campos ?? {});
        setGeneral(mensajeDe(cuerpo, r.status));
        requestAnimationFrame(() => refGeneral.current?.focus());
        return;
      }
      if (exito) {
        setListo(true);
        setTimeout(() => location.assign(destino), 1500);
      } else location.assign(destino);
    } catch {
      setGeneral('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <p className="aviso aviso-exito" role="status">
        {exito}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      {general && (
        <div ref={refGeneral} tabIndex={-1} role="alert" className="aviso aviso-error">
          {general}
        </div>
      )}
      {campos.map((c) => {
        const idCampo = `${id}-${c.nombre}`;
        const error = errores[c.nombre];
        const descripciones = [c.ayuda && `${idCampo}-ayuda`, error && `${idCampo}-error`].filter(Boolean).join(' ');
        return (
          <div key={c.nombre}>
            <label htmlFor={idCampo} className="etiqueta">
              {c.etiqueta}
            </label>
            <input
              id={idCampo}
              name={c.nombre}
              type={c.tipo ?? 'text'}
              autoComplete={c.autocomplete}
              defaultValue={c.valor}
              readOnly={c.soloLectura}
              required
              className={`campo ${c.soloLectura ? 'bg-fondo' : ''}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={descripciones || undefined}
            />
            {c.ayuda && (
              <p id={`${idCampo}-ayuda`} className="ayuda mt-1">
                {c.ayuda}
              </p>
            )}
            {error && (
              <p id={`${idCampo}-error`} className="error-campo mt-1">
                {error}
              </p>
            )}
          </div>
        );
      })}
      <button type="submit" className="boton boton-primario w-full" disabled={enviando}>
        {enviando ? 'Un momento…' : boton}
      </button>
    </form>
  );
}
