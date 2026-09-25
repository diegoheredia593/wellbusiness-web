/**
 * Edición de los textos de una página del sitio, agrupados por sección.
 * Guarda solo lo que cambió; "Descartar cambios" vuelve a lo guardado.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Imagen, TextoEnriquecido } from '@cms/core/schema';
import type { SeccionEditable, BloqueEditable } from '@/lib/servidor/bloques';
import Campo from './campos/Campo';
import EditorRico, { largoRico } from './campos/EditorRico';
import CampoImagen from './campos/CampoImagen';
import { useAvisoAlSalir } from '@/lib/cliente/usar-aviso-salir';

interface Props {
  pagina: string;
  secciones: SeccionEditable[];
  /** Lo que guarda este usuario queda pendiente de aprobación. */
  enRevision: boolean;
  esAdmin: boolean;
}

type Valores = Record<string, unknown>;

const AYUDA_URL = 'Una página del sitio (por ejemplo /como-ayudar), una dirección https://, mailto: o tel:.';

function largoDe(b: BloqueEditable, v: unknown) {
  if (b.tipo === 'texto_enriquecido') return largoRico((v as TextoEnriquecido | null) ?? null);
  return typeof v === 'string' ? v.length : 0;
}

function CampoBloque({
  b,
  valor,
  error,
  onCambio,
}: {
  b: BloqueEditable;
  valor: unknown;
  error?: string;
  onCambio: (v: unknown) => void;
}) {
  const id = `b-${b.key.replace(/\./g, '-')}`;
  const ayuda = b.ayuda ?? (b.tipo === 'url' ? AYUDA_URL : undefined);
  const esImagen = b.tipo === 'imagen';
  return (
    <Campo
      id={id}
      etiqueta={b.campo}
      obligatorio={b.obligatorio}
      ayuda={ayuda}
      error={error}
      max={esImagen ? null : b.maxLength}
      largo={largoDe(b, valor)}
      grupo={esImagen}
    >
      {(describedBy) => {
        if (b.tipo === 'texto_enriquecido') {
          return (
            <EditorRico
              id={id}
              valor={(valor as TextoEnriquecido | null) ?? null}
              onCambio={onCambio}
              describedBy={describedBy}
              invalido={!!error}
              etiquetaAccesible={b.campo}
            />
          );
        }
        if (esImagen) {
          return (
            <CampoImagen
              id={id}
              valor={(valor as Imagen | null) ?? null}
              onCambio={onCambio}
              proporcion={b.proporcion}
              describedBy={describedBy}
              puedeQuitar={!b.obligatorio}
            />
          );
        }
        const comun = {
          id,
          name: b.key,
          className: 'campo',
          value: typeof valor === 'string' ? valor : '',
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          onChange: (e: { target: { value: string } }) => onCambio(e.target.value),
        };
        return b.tipo === 'texto_largo' ? (
          <textarea {...comun} rows={Math.min(8, Math.max(3, Math.ceil((b.maxLength ?? 300) / 120)))} />
        ) : (
          <input {...comun} type="text" inputMode={b.tipo === 'url' ? 'url' : undefined} spellCheck={b.tipo !== 'url'} />
        );
      }}
    </Campo>
  );
}

export default function EditorBloques({ pagina, secciones, enRevision, esAdmin }: Props) {
  const inicial = useMemo(() => {
    const v: Valores = {};
    for (const s of secciones) for (const b of s.bloques) v[b.key] = b.borrador ?? b.valor;
    return v;
  }, [secciones]);

  const [guardado, setGuardado] = useState<Valores>(inicial);
  const [valores, setValores] = useState<Valores>(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const refEstado = useRef<HTMLDivElement>(null);

  const cambiados = Object.keys(valores).filter((k) => JSON.stringify(valores[k]) !== JSON.stringify(guardado[k]));
  useAvisoAlSalir(cambiados.length > 0);

  const pendientes = secciones.flatMap((s) => s.bloques).filter((b) => b.borrador !== null);

  async function guardar() {
    setGuardando(true);
    setEstado(null);
    const cambios = Object.fromEntries(cambiados.map((k) => [k, valores[k]]));
    try {
      const r = await fetch(`/api/paginas/${pagina}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cambios }),
      });
      const c = (await r.json().catch(() => null)) as { error?: string; campos?: Record<string, string>; modo?: string } | null;
      if (!r.ok) {
        setErrores(c?.campos ?? {});
        setEstado({ tipo: 'error', texto: c?.error ?? 'No se pudo guardar. Inténtalo de nuevo.' });
        requestAnimationFrame(() => {
          const primero = Object.keys(c?.campos ?? {})[0];
          const el = primero ? document.getElementById(`b-${primero.replace(/\./g, '-')}`) : null;
          (el ?? refEstado.current)?.focus();
        });
        return;
      }
      setErrores({});
      setGuardado({ ...valores });
      setEstado({
        tipo: 'ok',
        texto:
          c?.modo === 'revision'
            ? 'Cambios enviados a revisión. Un administrador los publicará.'
            : `Guardado: ${cambiados.length} ${cambiados.length === 1 ? 'campo' : 'campos'}.`,
      });
      requestAnimationFrame(() => refEstado.current?.focus());
    } catch {
      setEstado({ tipo: 'error', texto: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.' });
    } finally {
      setGuardando(false);
    }
  }

  async function resolver(aprobar: boolean) {
    const r = await fetch(`/api/paginas/${pagina}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: aprobar ? 'aprobar' : 'descartar' }),
    });
    if (r.ok) location.reload();
  }

  return (
    <div className="pb-28">
      <div ref={refEstado} tabIndex={-1} aria-live="polite" className="outline-none">
        {estado && <p className={`aviso mb-5 ${estado.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{estado.texto}</p>}
      </div>

      {esAdmin && pendientes.length > 0 && (
        <div className="aviso aviso-advertencia mb-6 flex flex-wrap items-center justify-between gap-3">
          <p>
            Hay {pendientes.length} {pendientes.length === 1 ? 'cambio' : 'cambios'} en revisión en esta página (se
            muestran en los campos).
          </p>
          <div className="flex gap-2">
            <button type="button" className="boton boton-primario boton-chico" onClick={() => void resolver(true)}>
              Aprobar y publicar
            </button>
            <button type="button" className="boton boton-secundario boton-chico" onClick={() => void resolver(false)}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {secciones.length > 2 && (
        <nav aria-label="Secciones de la página" className="mb-6">
          <ul className="flex flex-wrap gap-2">
            {secciones.map((s) => (
              <li key={s.id}>
                <a href={`#s-${s.id.replace(/\./g, '-')}`} className="boton boton-secundario boton-chico">
                  {s.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="space-y-6">
        {secciones.map((s) => (
          <section key={s.id} id={`s-${s.id.replace(/\./g, '-')}`} aria-labelledby={`t-${s.id}`} className="tarjeta scroll-mt-20 p-4 sm:p-6">
            <h2 id={`t-${s.id}`} className="mb-4 text-xl font-bold">
              {s.etiqueta}
            </h2>
            <div className="space-y-6">
              {s.bloques.map((b) => (
                <CampoBloque
                  key={b.key}
                  b={b}
                  valor={valores[b.key]}
                  error={errores[b.key]}
                  onCambio={(v) => setValores((x) => ({ ...x, [b.key]: v }))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:left-72 ${
          cambiados.length ? '' : 'hidden'
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="font-semibold" aria-live="polite">
            {cambiados.length} {cambiados.length === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="boton boton-secundario"
              disabled={guardando}
              onClick={() => {
                setValores({ ...guardado });
                setErrores({});
                setEstado(null);
              }}
            >
              Descartar cambios
            </button>
            <button type="button" className="boton boton-primario" disabled={guardando} onClick={() => void guardar()}>
              {guardando ? 'Guardando…' : enRevision ? 'Enviar a revisión' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
