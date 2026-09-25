/** Envíos de un formulario: marcar leído, ver completo, borrar (admin). */
import { useState } from 'react';

interface Envio {
  id: string;
  fecha: string;
  leido: boolean;
  esEjemplo: boolean;
  campos: { etiqueta: string; valor: string }[];
}

interface Props {
  envios: Envio[];
  esAdmin: boolean;
}

export default function ListaEnvios({ envios: inicial, esAdmin }: Props) {
  const [envios, setEnvios] = useState(inicial);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function leer(e: Envio, leido: boolean) {
    const r = await fetch(`/api/envios/${e.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leido }),
    });
    if (r.ok) {
      setEnvios((xs) => xs.map((x) => (x.id === e.id ? { ...x, leido } : x)));
      setMensaje(leido ? 'Marcado como leído.' : 'Marcado como no leído.');
    }
  }

  async function borrar(e: Envio) {
    if (!confirm('¿Borrar este envío? No se puede deshacer.')) return;
    const r = await fetch(`/api/envios/${e.id}`, { method: 'DELETE' });
    if (r.ok) {
      setEnvios((xs) => xs.filter((x) => x.id !== e.id));
      setMensaje('Envío borrado.');
    }
  }

  if (envios.length === 0) {
    return <p className="tarjeta p-6 text-center text-tinta-suave">Todavía no llegó ningún envío de este formulario.</p>;
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {mensaje}
      </p>
      <ul className="space-y-3">
        {envios.map((e) => (
          <li key={e.id} className={`tarjeta p-4 ${e.leido ? '' : 'border-l-4 border-l-acento'}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{e.fecha}</span>
                {!e.leido && <span className="insignia bg-acento text-white">Nuevo</span>}
                {e.esEjemplo && <span className="insignia bg-aviso-suave text-aviso">Ejemplo</span>}
              </p>
              <div className="flex gap-2">
                <button type="button" className="boton boton-secundario boton-chico" onClick={() => void leer(e, !e.leido)}>
                  {e.leido ? 'Marcar como no leído' : 'Marcar como leído'}
                </button>
                {esAdmin && (
                  <button type="button" className="boton boton-secundario boton-chico" onClick={() => void borrar(e)}>
                    Borrar
                  </button>
                )}
              </div>
            </div>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
              {e.campos.map((c) => (
                <div key={c.etiqueta} className="contents">
                  <dt className="text-sm font-semibold text-tinta-suave">{c.etiqueta}</dt>
                  <dd className="break-words whitespace-pre-line">{c.valor || '—'}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
