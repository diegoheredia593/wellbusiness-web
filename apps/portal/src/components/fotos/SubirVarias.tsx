/**
 * Subir varias fotos a la vez (galerías): se reducen y convierten en el
 * navegador, cada una necesita su texto alternativo y se suben en orden.
 * También permite agregar fotos que ya están en la biblioteca.
 */
import { useEffect, useId, useState } from 'react';
import type { Imagen } from '@cms/core/schema';
import Dialogo from '../Dialogo';
import Biblioteca from './Biblioteca';
import { AYUDA_ALT, procesarFoto, problemaArchivo, subirFoto, type FotoProcesada } from '@/lib/cliente/imagenes';

interface Props {
  abierto: boolean;
  onAgregar: (imagenes: Imagen[]) => void;
  onCerrar: () => void;
}

interface Pendiente {
  clave: string;
  foto: FotoProcesada;
  alt: string;
  estado: 'lista' | 'subiendo' | 'subida' | 'error';
  error?: string;
  imagen?: Imagen;
}

export default function SubirVarias({ abierto, onAgregar, onCerrar }: Props) {
  const idArchivos = useId();
  const [pestana, setPestana] = useState<'subir' | 'biblioteca'>('subir');
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [faltanAlt, setFaltanAlt] = useState(false);

  useEffect(() => {
    if (abierto) return;
    setPendientes((ps) => {
      ps.forEach((p) => URL.revokeObjectURL(p.foto.vista));
      return [];
    });
    setAvisos([]);
    setFaltanAlt(false);
  }, [abierto]);

  async function alElegir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setProcesando(true);
    const nuevos: Pendiente[] = [];
    const problemas: string[] = [];
    for (const archivo of Array.from(archivos)) {
      const p = problemaArchivo(archivo);
      if (p) {
        problemas.push(p);
        continue;
      }
      try {
        const foto = await procesarFoto(archivo, archivo.name);
        nuevos.push({ clave: crypto.randomUUID(), foto, alt: '', estado: 'lista' });
      } catch (e) {
        problemas.push(`«${archivo.name}»: ${(e as Error).message}`);
      }
    }
    setPendientes((ps) => [...ps, ...nuevos]);
    setAvisos(problemas);
    setProcesando(false);
  }

  async function subirTodas() {
    if (pendientes.some((p) => p.estado !== 'subida' && p.alt.trim().length < 5)) {
      setFaltanAlt(true);
      return;
    }
    setFaltanAlt(false);
    setSubiendo(true);
    const resultado = [...pendientes];
    for (let i = 0; i < resultado.length; i++) {
      const p = resultado[i]!;
      if (p.estado === 'subida') continue;
      resultado[i] = { ...p, estado: 'subiendo' };
      setPendientes([...resultado]);
      try {
        const m = await subirFoto(p.foto, p.alt);
        resultado[i] = {
          ...p,
          estado: 'subida',
          imagen: { src: m.src, alt: m.alt, ancho: m.ancho, alto: m.alto, medio: m.id },
        };
      } catch (e) {
        resultado[i] = { ...p, estado: 'error', error: (e as Error).message };
      }
      setPendientes([...resultado]);
    }
    setSubiendo(false);
    const listas = resultado.filter((p) => p.estado === 'subida' && p.imagen).map((p) => p.imagen!);
    if (resultado.every((p) => p.estado === 'subida')) {
      onAgregar(listas);
    }
  }

  const sinSubir = pendientes.filter((p) => p.estado !== 'subida').length;
  const pie =
    pestana === 'subir' && pendientes.length > 0 ? (
      <>
        {pendientes.some((p) => p.estado === 'subida') && sinSubir > 0 && (
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => onAgregar(pendientes.filter((p) => p.imagen).map((p) => p.imagen!))}
            disabled={subiendo}
          >
            Agregar solo las subidas
          </button>
        )}
        <button type="button" className="boton boton-primario" onClick={subirTodas} disabled={subiendo || procesando || !sinSubir}>
          {subiendo ? 'Subiendo…' : `Subir ${sinSubir} ${sinSubir === 1 ? 'foto' : 'fotos'}`}
        </button>
      </>
    ) : null;

  return (
    <Dialogo abierto={abierto} titulo="Agregar fotos a la galería" onCerrar={onCerrar} pie={pie} ancho="grande">
      <div role="tablist" aria-label="Origen de las fotos" className="mb-4 flex gap-2">
        {(['subir', 'biblioteca'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            type="button"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={`boton boton-chico ${pestana === p ? 'boton-primario' : 'boton-secundario'}`}
          >
            {p === 'subir' ? 'Subir fotos nuevas' : 'Elegir de la biblioteca'}
          </button>
        ))}
      </div>

      {pestana === 'biblioteca' ? (
        <div role="tabpanel">
          <Biblioteca
            multiple
            onElegirVarias={(ms) => onAgregar(ms.map((m) => ({ src: m.src, alt: m.alt, ancho: m.ancho, alto: m.alto, medio: m.id })))}
          />
        </div>
      ) : (
        <div role="tabpanel">
          <div className="rounded-xl border-2 border-dashed border-borde-campo p-5 text-center">
            <p className="ayuda mb-3">Puedes elegir varias a la vez. Se reducen y convierten automáticamente.</p>
            <label htmlFor={idArchivos} className="boton boton-primario cursor-pointer">
              {pendientes.length ? 'Agregar más fotos' : 'Elegir fotos'}
            </label>
            <input
              id={idArchivos}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                void alElegir(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          {procesando && (
            <p role="status" className="mt-3">
              Preparando las fotos…
            </p>
          )}
          {avisos.length > 0 && (
            <ul role="alert" className="aviso aviso-advertencia mt-3 list-disc space-y-1 pl-8">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {faltanAlt && (
            <p role="alert" className="aviso aviso-error mt-3">
              Cada foto necesita su texto alternativo (al menos 5 caracteres).
            </p>
          )}
          {pendientes.length > 0 && <p className="ayuda mt-4">{AYUDA_ALT}</p>}
          <ul className="mt-4 space-y-3">
            {pendientes.map((p, i) => (
              <li key={p.clave} className="grid grid-cols-[5rem_1fr] gap-3 rounded-lg border border-borde p-2 sm:grid-cols-[7rem_1fr]">
                <img src={p.foto.vista} alt="" className="aspect-square w-full rounded bg-fondo object-cover" />
                <div className="min-w-0">
                  <label htmlFor={`${idArchivos}-${p.clave}`} className="etiqueta text-sm">
                    Texto alternativo de la foto {i + 1}
                  </label>
                  <textarea
                    id={`${idArchivos}-${p.clave}`}
                    className="campo min-h-16"
                    value={p.alt}
                    maxLength={250}
                    disabled={p.estado === 'subida' || p.estado === 'subiendo'}
                    aria-invalid={faltanAlt && p.alt.trim().length < 5 ? true : undefined}
                    onChange={(e) =>
                      setPendientes((ps) => ps.map((x) => (x.clave === p.clave ? { ...x, alt: e.target.value } : x)))
                    }
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    {p.estado === 'subiendo' && <span className="insignia bg-info-suave">Subiendo…</span>}
                    {p.estado === 'subida' && <span className="insignia bg-exito-suave text-exito">Subida</span>}
                    {p.estado === 'error' && <span className="error-campo">{p.error}</span>}
                    {p.estado !== 'subida' && p.estado !== 'subiendo' && (
                      <button
                        type="button"
                        className="boton-texto boton boton-chico"
                        onClick={() => {
                          URL.revokeObjectURL(p.foto.vista);
                          setPendientes((ps) => ps.filter((x) => x.clave !== p.clave));
                        }}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialogo>
  );
}
