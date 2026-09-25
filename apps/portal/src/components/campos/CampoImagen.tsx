/** Campo de una foto: vista previa, cambiar, quitar y editar su texto alternativo. */
import { useState } from 'react';
import type { Imagen } from '@cms/core/schema';
import SelectorFoto, { nombreProporcion } from '../fotos/SelectorFoto';
import { aspecto, verSrc } from '@/lib/cliente/imagenes';

interface Props {
  id: string;
  valor: Imagen | null;
  onCambio: (v: Imagen | null) => void;
  proporcion?: string | null;
  describedBy?: string;
  puedeQuitar: boolean;
}

export default function CampoImagen({ id, valor, onCambio, proporcion, describedBy, puedeQuitar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const relacion = aspecto(proporcion);

  return (
    <div id={id} className="rounded-lg border border-borde-campo bg-white p-3" aria-describedby={describedBy}>
      {valor ? (
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <img
            src={verSrc(valor.src)}
            alt=""
            className="w-full rounded bg-fondo object-cover"
            style={{ aspectRatio: relacion ? String(relacion) : `${valor.ancho} / ${valor.alto}` }}
          />
          <div className="min-w-0 space-y-3">
            <div>
              <label htmlFor={`${id}-alt`} className="etiqueta text-sm">
                Texto alternativo <span className="font-normal text-tinta-suave">(obligatorio)</span>
              </label>
              <textarea
                id={`${id}-alt`}
                className="campo min-h-16"
                value={valor.alt}
                maxLength={250}
                aria-invalid={valor.alt.trim().length < 5 ? true : undefined}
                onChange={(e) => onCambio({ ...valor, alt: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => setAbierto(true)}>
                Cambiar foto
              </button>
              {puedeQuitar && (
                <button type="button" className="boton boton-secundario boton-chico" onClick={() => onCambio(null)}>
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-hidden
            className="grid h-20 w-28 place-items-center rounded bg-fondo text-xs text-tinta-suave"
            style={relacion ? { aspectRatio: String(relacion), height: 'auto' } : undefined}
          >
            Sin foto
          </div>
          <div>
            <button type="button" className="boton boton-secundario" onClick={() => setAbierto(true)}>
              Elegir foto
            </button>
            <p className="ayuda mt-1">Formato: {nombreProporcion(proporcion)}</p>
          </div>
        </div>
      )}
      <SelectorFoto
        abierto={abierto}
        proporcion={proporcion}
        onCerrar={() => setAbierto(false)}
        onElegir={(img) => {
          onCambio(img);
          setAbierto(false);
        }}
      />
    </div>
  );
}
