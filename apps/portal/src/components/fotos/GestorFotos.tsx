/**
 * Biblioteca de fotos: subir varias, ver detalles, corregir el texto
 * alternativo, ver el espacio usado y borrar las que no se usan.
 */
import { useEffect, useId, useState } from 'react';
import Dialogo from '../Dialogo';
import SubirVarias from './SubirVarias';
import { verSrc, type MedioSubido } from '@/lib/cliente/imagenes';

function peso(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2).replace('.', ',')} GB`;
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.round(bytes / 1024)} KB`;
}

interface Espacio {
  usado: number;
  limite: number;
  fotos: number;
  sinUsar: number;
}

/** Desde qué fracción del límite se avisa. */
const AVISO_ESPACIO = 0.8;

function MedidorEspacio({ espacio }: { espacio: Espacio }) {
  const fraccion = espacio.limite > 0 ? espacio.usado / espacio.limite : 0;
  const pct = Math.min(100, Math.round(fraccion * 100));
  const alto = fraccion >= AVISO_ESPACIO;
  return (
    <div className="tarjeta mb-5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Espacio usado</p>
        <p className="text-sm text-tinta-suave">
          {peso(espacio.usado)} de {peso(espacio.limite)} · {espacio.fotos} {espacio.fotos === 1 ? 'foto' : 'fotos'}
        </p>
      </div>
      <div
        role="meter"
        aria-label="Espacio usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} % usado`}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-fondo"
      >
        <div className={`h-full rounded-full ${alto ? 'bg-peligro' : 'bg-acento'}`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
      {alto && (
        <p className="aviso aviso-error mt-3">
          Queda poco espacio ({pct} % usado). Revisa las fotos sin usar y borra las que ya no hagan falta.
        </p>
      )}
    </div>
  );
}

export default function GestorFotos({ esAdmin = false }: { esAdmin?: boolean }) {
  const idBuscar = useId();
  const idAlt = useId();
  const [medios, setMedios] = useState<MedioSubido[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [subir, setSubir] = useState(false);
  const [elegida, setElegida] = useState<MedioSubido | null>(null);
  const [alt, setAlt] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [sinUsar, setSinUsar] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  async function cargar(desde: string | null, termino: string, soloSinUsar = sinUsar) {
    setCargando(true);
    const q = new URLSearchParams({
      buscar: termino,
      ...(desde ? { desde } : {}),
      ...(soloSinUsar ? { sinUsar: '1' } : {}),
    });
    const r = await fetch(`/api/medios?${q}`);
    const c = (await r.json()) as { medios: MedioSubido[]; siguiente: string | null; espacio: Espacio | null };
    setMedios((m) => (desde ? [...m, ...c.medios] : c.medios));
    setSiguiente(c.siguiente);
    if (c.espacio) setEspacio(c.espacio);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(() => void cargar(null, buscar, sinUsar), buscar ? 300 : 0);
    return () => clearTimeout(t);
  }, [buscar, sinUsar]);

  function abrir(m: MedioSubido) {
    setElegida(m);
    setAlt(m.alt);
    setErrorDialogo(null);
    setConfirmarBorrado(false);
  }

  async function guardarAlt() {
    if (!elegida) return;
    const r = await fetch(`/api/medios/${elegida.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt }),
    });
    const c = (await r.json().catch(() => null)) as { error?: string; campos?: Record<string, string> } | null;
    if (!r.ok) return setErrorDialogo(c?.campos?.alt ?? c?.error ?? 'No se pudo guardar.');
    setMedios((xs) => xs.map((x) => (x.id === elegida.id ? { ...x, alt: alt.trim() } : x)));
    setElegida(null);
    setMensaje({
      tipo: 'ok',
      texto: 'Texto guardado. Las páginas que ya usaban esta foto conservan su propio texto alternativo.',
    });
  }

  async function borrar() {
    if (!elegida) return;
    const r = await fetch(`/api/medios/${elegida.id}`, { method: 'DELETE' });
    const c = (await r.json().catch(() => null)) as { error?: string } | null;
    if (!r.ok) return setErrorDialogo(c?.error ?? 'No se pudo borrar.');
    setMedios((xs) => xs.filter((x) => x.id !== elegida.id));
    setElegida(null);
    setMensaje({ tipo: 'ok', texto: `Foto borrada. Se liberaron ${peso(elegida.peso)}.` });
    setEspacio((e) =>
      e ? { ...e, usado: Math.max(0, e.usado - elegida.peso), fotos: e.fotos - 1, sinUsar: Math.max(0, e.sinUsar - 1) } : e,
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:w-80">
          <label htmlFor={idBuscar} className="etiqueta">
            Buscar
          </label>
          <input id={idBuscar} type="search" className="campo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
        <button type="button" className="boton boton-primario" onClick={() => setSubir(true)}>
          Subir fotos
        </button>
      </div>

      {espacio && <MedidorEspacio espacio={espacio} />}

      {esAdmin && (
        <div role="group" aria-label="Qué fotos mostrar" className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!sinUsar}
            className={`boton ${!sinUsar ? 'boton-primario' : 'boton-secundario'}`}
            onClick={() => setSinUsar(false)}
          >
            Todas
          </button>
          <button
            type="button"
            aria-pressed={sinUsar}
            className={`boton ${sinUsar ? 'boton-primario' : 'boton-secundario'}`}
            onClick={() => setSinUsar(true)}
          >
            Fotos sin usar{espacio ? ` (${espacio.sinUsar})` : ''}
          </button>
        </div>
      )}
      {sinUsar && (
        <p className="ayuda mb-4 max-w-2xl">
          Fotos que no aparecen en ninguna página ni publicación (tampoco en borradores, archivados o la papelera). Borrarlas
          libera espacio y no se puede deshacer.
        </p>
      )}

      <div aria-live="polite" className="mb-3">
        {mensaje && <p className={`aviso ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{mensaje.texto}</p>}
      </div>

      {!cargando && medios.length === 0 && (
        <p className="tarjeta p-6 text-center text-tinta-suave">
          {buscar
            ? 'No hay fotos que coincidan.'
            : sinUsar
              ? 'Todas las fotos se están usando. No hay nada que borrar.'
              : 'Todavía no hay fotos. Sube las primeras.'}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {medios.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => abrir(m)} className="tarjeta block w-full overflow-hidden text-left hover:border-borde-campo">
              <img src={verSrc(m.src)} alt="" loading="lazy" className="aspect-square w-full bg-fondo object-cover" />
              <span className="block truncate px-2 py-1.5 text-sm">{m.alt}</span>
              <span className="sr-only">Ver detalles</span>
            </button>
          </li>
        ))}
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

      <SubirVarias
        abierto={subir}
        onCerrar={() => setSubir(false)}
        onAgregar={(nuevas) => {
          setSubir(false);
          setMensaje({ tipo: 'ok', texto: nuevas.length === 1 ? 'Se subió 1 foto.' : `Se subieron ${nuevas.length} fotos.` });
          void cargar(null, buscar);
        }}
      />

      <Dialogo
        abierto={!!elegida}
        titulo="Detalles de la foto"
        onCerrar={() => setElegida(null)}
        ancho="grande"
        pie={
          confirmarBorrado ? (
            <>
              <button type="button" className="boton boton-secundario" onClick={() => setConfirmarBorrado(false)}>
                No, conservarla
              </button>
              <button type="button" className="boton boton-peligro" onClick={() => void borrar()}>
                Sí, borrar para siempre
              </button>
            </>
          ) : (
            <>
              <button type="button" className="boton boton-secundario text-peligro" onClick={() => setConfirmarBorrado(true)}>
                Borrar foto
              </button>
              <button type="button" className="boton boton-primario" onClick={() => void guardarAlt()}>
                Guardar
              </button>
            </>
          )
        }
      >
        {elegida && (
          <div className="grid gap-5 md:grid-cols-2">
            <img src={verSrc(elegida.src)} alt="" className="max-h-80 w-full rounded bg-fondo object-contain" />
            <div className="space-y-4">
              {confirmarBorrado && (
                <p role="alert" className="aviso aviso-error">
                  ¿Borrar esta foto? Se elimina del portal y del almacenamiento, y no se puede deshacer.
                </p>
              )}
              {errorDialogo && (
                <p role="alert" className="aviso aviso-error">
                  {errorDialogo}
                </p>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="font-semibold text-tinta-suave">Archivo</dt>
                <dd className="break-all">{elegida.nombre}</dd>
                <dt className="font-semibold text-tinta-suave">Medidas</dt>
                <dd>
                  {elegida.ancho} × {elegida.alto} px
                </dd>
                <dt className="font-semibold text-tinta-suave">Peso</dt>
                <dd>{peso(elegida.peso)}</dd>
              </dl>
              <div>
                <label htmlFor={idAlt} className="etiqueta">
                  Texto alternativo
                </label>
                <textarea id={idAlt} className="campo" value={alt} maxLength={250} onChange={(e) => setAlt(e.target.value)} />
                <p className="ayuda mt-1">Es el texto que se propone cuando alguien elige esta foto.</p>
              </div>
            </div>
          </div>
        )}
      </Dialogo>
    </div>
  );
}
