/**
 * Envoltorio común de un campo: etiqueta, marca de obligatorio, ayuda,
 * contador de caracteres y mensaje de error, conectados con aria-describedby.
 */
import type { ReactNode } from 'react';

interface Props {
  id: string;
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
  error?: string;
  /** Caracteres usados y límite, para el contador. */
  largo?: number;
  max?: number | null;
  /** Usa <fieldset> + <legend> (grupos de opciones, fotos, listas). */
  grupo?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
}

export function descripciones(id: string, p: { ayuda?: string; error?: string; max?: number | null }) {
  return [p.ayuda && `${id}-ayuda`, p.max && `${id}-contador`, p.error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

export function Contador({ id, largo, max }: { id: string; largo: number; max: number }) {
  const pasado = largo > max;
  const cerca = !pasado && largo > max * 0.9;
  return (
    <p
      id={`${id}-contador`}
      className={`text-sm tabular-nums ${pasado ? 'font-bold text-peligro' : cerca ? 'font-semibold text-aviso' : 'text-tinta-suave'}`}
    >
      {largo} / {max}
      {pasado && <span> · {largo - max} de más</span>}
    </p>
  );
}

export default function Campo({ id, etiqueta, obligatorio, ayuda, error, largo, max, grupo, children }: Props) {
  const describedBy = descripciones(id, { ayuda, error, max });
  const titulo = (
    <>
      {etiqueta}
      {obligatorio ? (
        <span className="ml-2 text-sm font-normal text-tinta-suave">(obligatorio)</span>
      ) : null}
    </>
  );
  const pie = (
    <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div className="min-w-0 flex-1">
        {ayuda && (
          <p id={`${id}-ayuda`} className="ayuda">
            {ayuda}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="error-campo">
            {error}
          </p>
        )}
      </div>
      {max ? <Contador id={id} largo={largo ?? 0} max={max} /> : null}
    </div>
  );

  if (grupo) {
    return (
      <fieldset aria-describedby={describedBy} className="min-w-0">
        <legend className="etiqueta">{titulo}</legend>
        {children(describedBy)}
        {pie}
      </fieldset>
    );
  }
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="etiqueta">
        {titulo}
      </label>
      {children(describedBy)}
      {pie}
    </div>
  );
}
