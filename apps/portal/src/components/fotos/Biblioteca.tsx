/** Cuadrícula de la biblioteca de fotos, con búsqueda y "cargar más". */
import { useEffect, useId, useState } from 'react';
import { verSrc, type MedioSubido } from '@/lib/cliente/imagenes';

interface Props {
  /** Elegir una sola foto. */
  onElegir?: (m: MedioSubido) => void;
  /** Elegir varias (galerías). */
  multiple?: boolean;
  onElegirVarias?: (ms: MedioSubido[]) => void;
}

export default function Biblioteca({ onElegir, multiple, onElegirVarias }: Props) {
  const idBuscar = useId();
  const [buscar, setBuscar] = useState('');
  const [medios, setMedios] = useState<MedioSubido[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [elegidas, setElegidas] = useState<MedioSubido[]>([]);

  async function cargar(desde: string | null, termino: string) {
    setCargando(true);
    const q = new URLSearchParams({ buscar: termino, ...(desde ? { desde } : {}) });
    const r = await fetch(`/api/medios?${q}`);
    const c = (await r.json()) as { medios: MedioSubido[]; siguiente: string | null };
    setMedios((m) => (desde ? [...m, ...c.medios] : c.medios));
    setSiguiente(c.siguiente);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(() => void cargar(null, buscar), buscar ? 300 : 0);
    return () => clearTimeout(t);
  }, [buscar]);

  const alternar = (m: MedioSubido) =>
    setElegidas((e) => (e.some((x) => x.id === m.id) ? e.filter((x) => x.id !== m.id) : [...e, m]));

  return (
    <div>
      <label htmlFor={idBuscar} className="etiqueta">
        Buscar por descripción o nombre
      </label>
      <input id={idBuscar} className="campo mb-4" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" />
      {!cargando && medios.length === 0 && (
        <p className="aviso aviso-info">{buscar ? 'No hay fotos que coincidan.' : 'Todavía no hay fotos en la biblioteca.'}</p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {medios.map((m) => {
          const marcada = elegidas.some((x) => x.id === m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => (multiple ? alternar(m) : onElegir?.(m))}
                aria-pressed={multiple ? marcada : undefined}
                className={`group block w-full overflow-hidden rounded-lg border-2 text-left ${
                  marcada ? 'border-acento ring-2 ring-acento' : 'border-borde hover:border-borde-campo'
                }`}
              >
                <img src={verSrc(m.src)} alt="" loading="lazy" className="aspect-square w-full bg-fondo object-cover" />
                <span className="block truncate px-2 py-1 text-sm">{m.alt}</span>
                {multiple && <span className="sr-only">{marcada ? 'Elegida' : 'Sin elegir'}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {cargando && (
        <p role="status" className="mt-3 text-tinta-suave">
          Cargando fotos…
        </p>
      )}
      {siguiente && !cargando && (
        <button type="button" className="boton boton-secundario mt-4" onClick={() => void cargar(siguiente, buscar)}>
          Ver más fotos
        </button>
      )}
      {multiple && (
        <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 border-t border-borde bg-white pt-3">
          <p aria-live="polite">{elegidas.length} elegidas</p>
          <button
            type="button"
            className="boton boton-primario"
            disabled={!elegidas.length}
            onClick={() => onElegirVarias?.(elegidas)}
          >
            Agregar a la galería
          </button>
        </div>
      )}
    </div>
  );
}
