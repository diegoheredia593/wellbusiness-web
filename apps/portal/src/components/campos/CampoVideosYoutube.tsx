/**
 * Videos de YouTube: pegar el enlace, ver la miniatura, escribir (o revisar)
 * el título, ordenar con "Antes"/"Después" y quitar. Se guarda solo el id.
 */
import { useId, useState } from 'react';
import type { VideoYoutube } from '@cms/core/schema';
import { enlaceYoutube, extraerIdYoutube, miniaturaYoutube } from '@cms/core/youtube';

interface Props {
  id: string;
  valor: VideoYoutube[];
  onCambio: (v: VideoYoutube[]) => void;
  max?: number;
  describedBy?: string;
  errores: Record<string, string>;
  ruta: string;
}

type Estado = 'ok' | 'privado' | 'no_existe' | 'desconocido';

const AVISOS: Record<Exclude<Estado, 'ok'>, string> = {
  privado:
    'YouTube dice que este video es privado o no permite verse en otros sitios. Cámbialo a Público o No listado en YouTube; si no, no se verá en el sitio.',
  no_existe: 'YouTube no encuentra este video. Revisa que el enlace esté completo.',
  desconocido: 'No se pudo comprobar el video ahora. Revisa el título y que el video sea Público o No listado.',
};

async function consultar(idVideo: string): Promise<{ estado: Estado; titulo?: string }> {
  try {
    const r = await fetch(`/api/youtube?id=${encodeURIComponent(idVideo)}`);
    if (!r.ok) return { estado: 'desconocido' };
    return (await r.json()) as { estado: Estado; titulo?: string };
  } catch {
    return { estado: 'desconocido' };
  }
}

export default function CampoVideosYoutube({ id, valor, onCambio, max = 10, describedBy, errores, ruta }: Props) {
  const idEnlace = useId();
  const idAyuda = useId();
  const [enlace, setEnlace] = useState('');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [estados, setEstados] = useState<Record<string, Exclude<Estado, 'ok'>>>({});
  const [aviso, setAviso] = useState('');

  const lleno = valor.length >= max;

  async function agregar() {
    setError('');
    const idVideo = extraerIdYoutube(enlace);
    if (!idVideo) {
      setError(
        'Ese enlace no es de un video de YouTube. En YouTube, abre el video, toca "Compartir" y luego "Copiar"; después pégalo aquí.',
      );
      return;
    }
    if (valor.some((v) => v.id === idVideo)) {
      setError('Ese video ya está en la lista.');
      return;
    }
    setBuscando(true);
    const info = await consultar(idVideo);
    setBuscando(false);
    onCambio([...valor, { id: idVideo, titulo: info.titulo ?? '' }]);
    if (info.estado !== 'ok') setEstados((e) => ({ ...e, [idVideo]: info.estado as Exclude<Estado, 'ok'> }));
    setEnlace('');
    setAviso(info.titulo ? `Video agregado: ${info.titulo}.` : 'Video agregado. Escribe su título.');
  }

  function mover(i: number, delta: number) {
    const lista = [...valor];
    const [v] = lista.splice(i, 1);
    lista.splice(i + delta, 0, v!);
    onCambio(lista);
    setAviso(`Video movido a la posición ${i + delta + 1}.`);
  }

  return (
    <div id={id} aria-describedby={describedBy}>
      <p className="sr-only" aria-live="polite">
        {aviso}
      </p>

      {valor.length > 0 && (
        <ol className="mb-4 space-y-3">
          {valor.map((v, i) => {
            const idTitulo = `${id}-titulo-${i}`;
            const errorTitulo = errores[`${ruta}.${i}.titulo`];
            const errorId = errores[`${ruta}.${i}.id`];
            const estado = estados[v.id];
            return (
              <li key={v.id} className="rounded-lg border border-borde bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={enlaceYoutube(v.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block shrink-0 sm:w-48"
                    aria-label={`Ver el video ${i + 1} en YouTube (se abre en otra pestaña)`}
                  >
                    <img src={miniaturaYoutube(v.id)} alt="" loading="lazy" className="aspect-video w-full rounded bg-fondo object-cover" />
                    <span className="absolute top-1 right-1 rounded bg-tinta/80 px-1.5 text-sm font-bold text-white">{i + 1}</span>
                  </a>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={idTitulo} className="block text-sm font-semibold">
                      Título del video <span className="text-peligro">*</span>
                    </label>
                    <input
                      id={idTitulo}
                      className="campo"
                      value={v.titulo}
                      maxLength={120}
                      aria-invalid={errorTitulo ? true : undefined}
                      aria-describedby={errorTitulo ? `${idTitulo}-error` : undefined}
                      onChange={(e) => onCambio(valor.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                    />
                    <p className="ayuda mt-1">Lo leen en voz alta los lectores de pantalla antes de reproducir el video.</p>
                    {errorTitulo && (
                      <p id={`${idTitulo}-error`} className="mt-1 text-sm font-semibold text-peligro">
                        {errorTitulo}
                      </p>
                    )}
                    {errorId && <p className="mt-1 text-sm font-semibold text-peligro">{errorId}</p>}
                    {estado && <p className="aviso aviso-error mt-2 text-sm">{AVISOS[estado]}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button type="button" className="boton boton-secundario boton-chico" disabled={i === 0} onClick={() => mover(i, -1)}>
                        Antes
                      </button>
                      <button
                        type="button"
                        className="boton boton-secundario boton-chico"
                        disabled={i === valor.length - 1}
                        onClick={() => mover(i, 1)}
                      >
                        Después
                      </button>
                      <button
                        type="button"
                        className="boton boton-texto boton-chico"
                        onClick={() => {
                          onCambio(valor.filter((_, j) => j !== i));
                          setAviso('Video quitado.');
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {lleno ? (
        <p className="ayuda">Ya hay {max} videos, el máximo. Quita uno para agregar otro.</p>
      ) : (
        <div className="rounded-lg border border-dashed border-borde-campo p-3">
          <label htmlFor={idEnlace} className="block text-sm font-semibold">
            Pegar enlace de YouTube
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              id={idEnlace}
              type="url"
              inputMode="url"
              className="campo flex-1"
              placeholder="https://youtu.be/…"
              value={enlace}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${idAyuda}${error ? ` ${idAyuda}-error` : ''}`}
              onChange={(e) => {
                setEnlace(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void agregar();
                }
              }}
            />
            <button type="button" className="boton boton-secundario" disabled={!enlace.trim() || buscando} onClick={() => void agregar()}>
              {buscando ? 'Buscando…' : 'Agregar video'}
            </button>
          </div>
          {error && (
            <p id={`${idAyuda}-error`} role="alert" className="mt-2 text-sm font-semibold text-peligro">
              {error}
            </p>
          )}
          <p id={idAyuda} className="ayuda mt-2">
            En YouTube, abre el video y toca <strong>Compartir → Copiar</strong>. El video debe estar como <strong>Público</strong> o{' '}
            <strong>No listado</strong>; si es privado, no se verá en el sitio.
          </p>
        </div>
      )}
    </div>
  );
}
