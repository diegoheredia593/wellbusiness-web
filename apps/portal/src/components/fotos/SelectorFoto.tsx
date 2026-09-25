/**
 * Elegir una foto para un campo: subir una nueva (con recorte a la proporción
 * del campo) o reutilizar una de la biblioteca. El texto alternativo es
 * obligatorio antes de usarla.
 */
import { useCallback, useEffect, useId, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { Imagen } from '@cms/core/schema';
import Dialogo from '../Dialogo';
import Biblioteca from './Biblioteca';
import {
  aspecto,
  AYUDA_ALT,
  procesarFoto,
  problemaArchivo,
  recorteCentrado,
  cargarBitmap,
  subirFoto,
  type MedioSubido,
} from '@/lib/cliente/imagenes';

interface Props {
  abierto: boolean;
  proporcion: string | null | undefined;
  onElegir: (imagen: Imagen) => void;
  onCerrar: () => void;
}

type Paso =
  | { tipo: 'origen' }
  | { tipo: 'recortar'; fuente: Blob; nombre: string; vista: string; altInicial: string }
  | { tipo: 'alt'; fuente: Blob; nombre: string; recorte: Area | null; vista: string; altInicial: string };

export function nombreProporcion(p: string | null | undefined) {
  if (!p) return 'libre';
  const nombres: Record<string, string> = {
    '4:5': 'vertical (4:5)',
    '1:1': 'cuadrada (1:1)',
    '4:3': 'horizontal (4:3)',
    '16:9': 'panorámica (16:9)',
    '1200:630': 'para redes (1200×630)',
  };
  return nombres[p] ?? p;
}

export default function SelectorFoto({ abierto, proporcion, onElegir, onCerrar }: Props) {
  const idArchivo = useId();
  const idAlt = useId();
  const relacion = aspecto(proporcion);
  const [pestana, setPestana] = useState<'subir' | 'biblioteca'>('subir');
  const [paso, setPaso] = useState<Paso>({ tipo: 'origen' });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [alt, setAlt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const reiniciar = useCallback(() => {
    setPaso((p) => {
      if (p.tipo !== 'origen') URL.revokeObjectURL(p.vista);
      return { tipo: 'origen' };
    });
    setError(null);
    setAlt('');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!abierto) reiniciar();
  }, [abierto, reiniciar]);

  function empezar(fuente: Blob, nombre: string, altInicial = '') {
    const vista = URL.createObjectURL(fuente);
    setAlt(altInicial);
    if (relacion) setPaso({ tipo: 'recortar', fuente, nombre, vista, altInicial });
    else setPaso({ tipo: 'alt', fuente, nombre, recorte: null, vista, altInicial });
  }

  function alElegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    const problema = problemaArchivo(archivo);
    if (problema) return setError(problema);
    setError(null);
    empezar(archivo, archivo.name);
  }

  async function alElegirDeBiblioteca(m: MedioSubido) {
    // Si la foto ya tiene la proporción del campo, se usa tal cual.
    if (!relacion || Math.abs(m.ancho / m.alto - relacion) < 0.02) {
      onElegir({ src: m.src, alt: m.alt, ancho: m.ancho, alto: m.alto, medio: m.id });
      return;
    }
    // Si no, se recorta una copia con la proporción correcta.
    setTrabajando(true);
    try {
      const r = await fetch(m.src);
      empezar(await r.blob(), m.nombre, m.alt);
    } catch {
      setError('No se pudo abrir esa foto.');
    } finally {
      setTrabajando(false);
    }
  }

  async function usar() {
    if (paso.tipo !== 'alt') return;
    if (alt.trim().length < 5) return setError('Escribe el texto alternativo (al menos 5 caracteres).');
    setTrabajando(true);
    setError(null);
    try {
      let recorte = paso.recorte;
      if (!recorte && relacion) {
        const b = await cargarBitmap(paso.fuente);
        recorte = recorteCentrado(b.width, b.height, relacion);
        b.close();
      }
      const foto = await procesarFoto(paso.fuente, paso.nombre, recorte ?? undefined);
      const medio = await subirFoto(foto, alt);
      URL.revokeObjectURL(foto.vista);
      onElegir({ src: medio.src, alt: medio.alt, ancho: medio.ancho, alto: medio.alto, medio: medio.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTrabajando(false);
    }
  }

  const titulo =
    paso.tipo === 'recortar' ? 'Ajusta el encuadre' : paso.tipo === 'alt' ? 'Describe la foto' : 'Elegir una foto';

  const pie =
    paso.tipo === 'recortar' ? (
      <>
        <button type="button" className="boton boton-secundario" onClick={reiniciar}>
          Elegir otra
        </button>
        <button
          type="button"
          className="boton boton-primario"
          onClick={() => setPaso({ ...paso, tipo: 'alt', recorte: area })}
        >
          Continuar
        </button>
      </>
    ) : paso.tipo === 'alt' ? (
      <>
        <button type="button" className="boton boton-secundario" onClick={reiniciar} disabled={trabajando}>
          Elegir otra
        </button>
        <button type="button" className="boton boton-primario" onClick={usar} disabled={trabajando}>
          {trabajando ? 'Subiendo…' : 'Usar esta foto'}
        </button>
      </>
    ) : null;

  return (
    <Dialogo abierto={abierto} titulo={titulo} onCerrar={onCerrar} pie={pie} ancho="grande">
      {error && (
        <p role="alert" className="aviso aviso-error mb-4">
          {error}
        </p>
      )}

      {paso.tipo === 'origen' && (
        <div>
          <div role="tablist" aria-label="Origen de la foto" className="mb-4 flex gap-2">
            {(['subir', 'biblioteca'] as const).map((p) => (
              <button
                key={p}
                role="tab"
                type="button"
                aria-selected={pestana === p}
                onClick={() => setPestana(p)}
                className={`boton boton-chico ${pestana === p ? 'boton-primario' : 'boton-secundario'}`}
              >
                {p === 'subir' ? 'Subir una foto nueva' : 'Elegir de la biblioteca'}
              </button>
            ))}
          </div>
          {pestana === 'subir' ? (
            <div role="tabpanel" className="rounded-xl border-2 border-dashed border-borde-campo p-6 text-center">
              <p className="mb-1 font-semibold">Elige una foto de tu celular o computadora</p>
              <p className="ayuda mb-4">
                JPG, PNG o WebP. Formato del espacio: {nombreProporcion(proporcion)}. La foto se ajusta y se reduce
                automáticamente.
              </p>
              <label htmlFor={idArchivo} className="boton boton-primario cursor-pointer">
                Elegir foto
              </label>
              <input
                id={idArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => alElegirArchivo(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div role="tabpanel">
              {trabajando ? <p role="status">Abriendo la foto…</p> : <Biblioteca onElegir={alElegirDeBiblioteca} />}
            </div>
          )}
        </div>
      )}

      {paso.tipo === 'recortar' && (
        <div>
          <p className="ayuda mb-3">
            Arrastra la foto para elegir qué parte se ve (también con las flechas del teclado). Formato:{' '}
            {nombreProporcion(proporcion)}.
          </p>
          <div className="relative h-[55dvh] min-h-64 overflow-hidden rounded-lg bg-tinta">
            <Cropper
              image={paso.vista}
              crop={crop}
              zoom={zoom}
              aspect={relacion ?? 1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixeles) => setArea(pixeles)}
              objectFit="contain"
              keyboardStep={10}
            />
          </div>
          <label className="mt-3 flex items-center gap-3">
            <span className="font-semibold">Acercar</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-acento"
            />
          </label>
        </div>
      )}

      {paso.tipo === 'alt' && (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <img src={paso.vista} alt="" className="max-h-72 w-full rounded-lg bg-fondo object-contain" />
          <div>
            <label htmlFor={idAlt} className="etiqueta">
              Texto alternativo <span className="text-sm font-normal text-tinta-suave">(obligatorio)</span>
            </label>
            <textarea
              id={idAlt}
              className="campo"
              value={alt}
              maxLength={250}
              onChange={(e) => setAlt(e.target.value)}
              aria-describedby={`${idAlt}-ayuda`}
            />
            <p id={`${idAlt}-ayuda`} className="ayuda mt-1">
              {AYUDA_ALT} Lo leen las personas que usan lectores de pantalla y los buscadores.
            </p>
          </div>
        </div>
      )}
    </Dialogo>
  );
}
