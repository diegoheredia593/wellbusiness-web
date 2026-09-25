/**
 * Dibuja un campo a partir de su descripción (generada desde el esquema Zod).
 * Sirve para cualquier colección de cualquier cliente.
 */
import { useState } from 'react';
import type { Campo as DescCampo } from '@cms/core/campos';
import type { Imagen, TextoEnriquecido, VideoYoutube } from '@cms/core/schema';
import Campo from './Campo';
import EditorRico, { largoRico } from './EditorRico';
import CampoImagen from './CampoImagen';
import CampoGaleria from './CampoGaleria';
import CampoVideosYoutube from './CampoVideosYoutube';

export type OpcionRelacion = { valor: string; etiqueta: string; estado: string };

interface Props {
  campo: DescCampo;
  valor: unknown;
  onCambio: (v: unknown) => void;
  errores: Record<string, string>;
  /** Ruta del campo para ids y errores (p. ej. "convocatoria.fechas"). */
  ruta: string;
  relaciones: Record<string, OpcionRelacion[]>;
  /** Slug: el usuario ya lo tocó a mano. */
  onSlugManual?: () => void;
}

const idDe = (ruta: string) => `c-${ruta.replace(/\./g, '-')}`;

function CampoFecha({
  id,
  valor,
  onCambio,
  describedBy,
  invalido,
}: {
  id: string;
  valor: string | null;
  onCambio: (v: string | null) => void;
  describedBy?: string;
  invalido: boolean;
}) {
  const [soloMes, setSoloMes] = useState(!!valor && /^\d{4}-\d{2}$/.test(valor));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        id={id}
        type={soloMes ? 'month' : 'date'}
        className="campo w-auto"
        value={valor ? (soloMes ? valor.slice(0, 7) : valor.length === 7 ? `${valor}-01` : valor) : ''}
        onChange={(e) => onCambio(e.target.value || null)}
        aria-describedby={describedBy}
        aria-invalid={invalido || undefined}
      />
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          className="h-5 w-5 accent-acento"
          checked={soloMes}
          onChange={(e) => {
            setSoloMes(e.target.checked);
            if (valor) onCambio(e.target.checked ? valor.slice(0, 7) : `${valor.slice(0, 7)}-01`);
          }}
        />
        Solo mes y año
      </label>
      {valor && (
        <button type="button" className="boton boton-texto boton-chico" onClick={() => onCambio(null)}>
          Quitar fecha
        </button>
      )}
    </div>
  );
}

function ListaTexto({
  id,
  valor,
  onCambio,
  max,
  etiqueta,
  errores,
  ruta,
}: {
  id: string;
  valor: string[];
  onCambio: (v: string[]) => void;
  max?: number;
  etiqueta: string;
  errores: Record<string, string>;
  ruta: string;
}) {
  const mover = (i: number, d: number) => {
    const copia = [...valor];
    [copia[i], copia[i + d]] = [copia[i + d]!, copia[i]!];
    onCambio(copia);
  };
  return (
    <div>
      <ol className="space-y-2">
        {valor.map((texto, i) => {
          const err = errores[`${ruta}.${i}`];
          return (
            <li key={i} className="flex flex-wrap items-start gap-2">
              <span aria-hidden className="mt-3 w-6 text-right text-sm text-tinta-suave">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <input
                  id={i === 0 ? id : `${id}-${i}`}
                  className="campo"
                  value={texto}
                  maxLength={max ? max + 20 : undefined}
                  aria-label={`${etiqueta} ${i + 1}`}
                  aria-invalid={err ? true : undefined}
                  onChange={(e) => onCambio(valor.map((x, j) => (j === i ? e.target.value : x)))}
                />
                {err && <p className="error-campo mt-1">{err}</p>}
              </div>
              <div className="flex gap-1">
                <button type="button" className="boton boton-secundario boton-chico" disabled={i === 0} onClick={() => mover(i, -1)}>
                  <span aria-hidden>↑</span>
                  <span className="sr-only">Subir {i + 1}</span>
                </button>
                <button
                  type="button"
                  className="boton boton-secundario boton-chico"
                  disabled={i === valor.length - 1}
                  onClick={() => mover(i, 1)}
                >
                  <span aria-hidden>↓</span>
                  <span className="sr-only">Bajar {i + 1}</span>
                </button>
                <button
                  type="button"
                  className="boton boton-secundario boton-chico"
                  onClick={() => onCambio(valor.filter((_, j) => j !== i))}
                >
                  Quitar<span className="sr-only"> {i + 1}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="boton boton-secundario boton-chico mt-2" onClick={() => onCambio([...valor, ''])}>
        + Agregar
      </button>
    </div>
  );
}

export default function CampoGenerado({ campo, valor, onCambio, errores, ruta, relaciones, onSlugManual }: Props) {
  const id = idDe(ruta);
  const error = errores[ruta];
  const esGrupo = ['grupo', 'opciones', 'imagen', 'galeria', 'listaTexto', 'video_youtube', 'videos_youtube'].includes(campo.control);
  const largo =
    campo.control === 'rico' ? largoRico((valor as TextoEnriquecido | null) ?? null) : typeof valor === 'string' ? valor.length : 0;
  const conContador = ['texto', 'textoLargo', 'rico', 'slug', 'url', 'enlace'].includes(campo.control);

  if (campo.control === 'grupo') {
    const obj = (valor ?? {}) as Record<string, unknown>;
    return (
      <fieldset className="rounded-lg border border-borde p-4" id={id}>
        <legend className="px-1 font-bold">{campo.etiqueta}</legend>
        {campo.ayuda && <p className="ayuda mb-3">{campo.ayuda}</p>}
        <div className="space-y-5">
          {(campo.campos ?? []).map((sub) => (
            <CampoGenerado
              key={sub.nombre}
              campo={sub}
              valor={obj[sub.nombre]}
              onCambio={(v) => onCambio({ ...obj, [sub.nombre]: v })}
              errores={errores}
              ruta={`${ruta}.${sub.nombre}`}
              relaciones={relaciones}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <Campo
      id={id}
      etiqueta={campo.etiqueta}
      obligatorio={campo.obligatorio}
      ayuda={campo.ayuda}
      error={error}
      largo={largo}
      max={conContador ? (campo.max ?? null) : null}
      grupo={esGrupo}
    >
      {(describedBy) => {
        const texto = typeof valor === 'string' ? valor : '';
        const comunes = {
          id,
          className: 'campo',
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
        } as const;
        switch (campo.control) {
          case 'textoLargo':
            return (
              <textarea
                {...comunes}
                value={texto}
                rows={Math.min(8, Math.max(3, Math.ceil((campo.max ?? 300) / 120)))}
                onChange={(e) => onCambio(e.target.value)}
              />
            );
          case 'rico':
            return (
              <EditorRico
                id={id}
                valor={(valor as TextoEnriquecido | null) ?? null}
                onCambio={onCambio}
                describedBy={describedBy}
                invalido={!!error}
                etiquetaAccesible={campo.etiqueta}
              />
            );
          case 'slug':
            return (
              <input
                {...comunes}
                value={texto}
                spellCheck={false}
                autoCapitalize="off"
                onChange={(e) => {
                  onSlugManual?.();
                  onCambio(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
              />
            );
          case 'fecha':
            return (
              <CampoFecha
                id={id}
                valor={(valor as string | null) ?? null}
                onCambio={onCambio}
                describedBy={describedBy}
                invalido={!!error}
              />
            );
          case 'numero':
            return <input {...comunes} type="number" value={valor === null || valor === undefined ? '' : String(valor)} onChange={(e) => onCambio(e.target.value === '' ? null : Number(e.target.value))} />;
          case 'opcion':
          case 'relacion': {
            const opciones =
              campo.control === 'opcion'
                ? (campo.opciones ?? []).map((o) => ({ ...o, estado: 'publicado' }))
                : (relaciones[campo.nombre] ?? []);
            return (
              <select {...comunes} value={texto} onChange={(e) => onCambio(e.target.value || null)}>
                {(campo.anulable || !texto) && <option value="">— Elige una opción —</option>}
                {opciones.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                    {o.estado === 'borrador' ? ' (borrador)' : o.estado === 'archivado' ? ' (archivado)' : ''}
                  </option>
                ))}
              </select>
            );
          }
          case 'opciones': {
            const elegidos = Array.isArray(valor) ? (valor as string[]) : [];
            return (
              <div className="flex flex-wrap gap-x-6 gap-y-1" id={id}>
                {(campo.opciones ?? []).map((o) => (
                  <label key={o.valor} className="inline-flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-acento"
                      checked={elegidos.includes(o.valor)}
                      onChange={(e) =>
                        onCambio(e.target.checked ? [...elegidos, o.valor] : elegidos.filter((x) => x !== o.valor))
                      }
                    />
                    {o.etiqueta}
                  </label>
                ))}
              </div>
            );
          }
          case 'listaTexto':
            return (
              <ListaTexto
                id={id}
                valor={Array.isArray(valor) ? (valor as string[]) : []}
                onCambio={onCambio}
                max={campo.maxElemento}
                etiqueta={campo.etiqueta}
                errores={errores}
                ruta={ruta}
              />
            );
          case 'imagen':
            return (
              <CampoImagen
                id={id}
                valor={(valor as Imagen | null) ?? null}
                onCambio={onCambio}
                proporcion={campo.proporcion}
                describedBy={describedBy}
                puedeQuitar={campo.anulable}
              />
            );
          case 'galeria':
            return (
              <CampoGaleria id={id} valor={Array.isArray(valor) ? (valor as Imagen[]) : []} onCambio={onCambio} describedBy={describedBy} />
            );
          case 'videos_youtube':
            return (
              <CampoVideosYoutube
                id={id}
                valor={Array.isArray(valor) ? (valor as VideoYoutube[]) : []}
                onCambio={onCambio}
                max={campo.max}
                describedBy={describedBy}
                errores={errores}
                ruta={ruta}
              />
            );
          case 'video_youtube':
            // Un solo video: la misma interfaz, con máximo 1.
            return (
              <CampoVideosYoutube
                id={id}
                valor={valor ? [valor as VideoYoutube] : []}
                onCambio={(v) => onCambio(v[0] ?? null)}
                max={1}
                describedBy={describedBy}
                errores={Object.fromEntries(
                  Object.entries(errores)
                    .filter(([k]) => k.startsWith(`${ruta}.`))
                    .map(([k, m]) => [k.replace(`${ruta}.`, `${ruta}.0.`), m]),
                )}
                ruta={ruta}
              />
            );
          case 'url':
            return <input {...comunes} type="url" inputMode="url" value={texto} placeholder="https://" onChange={(e) => onCambio(e.target.value)} />;
          default:
            return <input {...comunes} type="text" value={texto} onChange={(e) => onCambio(e.target.value)} />;
        }
      }}
    </Campo>
  );
}

export { idDe };
