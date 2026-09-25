/** Papelera: recuperar o (solo admin) borrar definitivamente. */
import { useState } from 'react';
import Dialogo from './Dialogo';

interface Elemento {
  id: string;
  titulo: string;
  coleccion: string;
  eliminado: string;
  vence: string;
}

export default function Papelera({ items: inicial, esAdmin }: { items: Elemento[]; esAdmin: boolean }) {
  const [items, setItems] = useState(inicial);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [aBorrar, setABorrar] = useState<Elemento | null>(null);

  async function recuperar(e: Elemento) {
    const r = await fetch(`/api/papelera/${e.id}`, { method: 'POST' });
    const c = (await r.json().catch(() => null)) as { error?: string } | null;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: c?.error ?? 'No se pudo recuperar.' });
    setItems((xs) => xs.filter((x) => x.id !== e.id));
    setMensaje({ tipo: 'ok', texto: `«${e.titulo}» se recuperó como borrador en ${e.coleccion}.` });
  }

  async function borrar() {
    if (!aBorrar) return;
    const r = await fetch(`/api/papelera/${aBorrar.id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((xs) => xs.filter((x) => x.id !== aBorrar.id));
      setMensaje({ tipo: 'ok', texto: `«${aBorrar.titulo}» se borró definitivamente.` });
    } else setMensaje({ tipo: 'error', texto: 'No se pudo borrar.' });
    setABorrar(null);
  }

  return (
    <div>
      <div aria-live="polite" className="mb-3">
        {mensaje && <p className={`aviso ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{mensaje.texto}</p>}
      </div>
      {items.length === 0 ? (
        <p className="tarjeta p-6 text-center text-tinta-suave">La papelera está vacía.</p>
      ) : (
        <ul className="tarjeta divide-y divide-borde">
          {items.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-semibold">{e.titulo}</p>
                <p className="text-sm text-tinta-suave">
                  {e.coleccion} · eliminado el {e.eliminado} · se borra el {e.vence}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="boton boton-secundario boton-chico" onClick={() => void recuperar(e)}>
                  Recuperar<span className="sr-only"> «{e.titulo}»</span>
                </button>
                {esAdmin && (
                  <button type="button" className="boton boton-secundario boton-chico" onClick={() => setABorrar(e)}>
                    Borrar ya<span className="sr-only"> «{e.titulo}»</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialogo
        abierto={!!aBorrar}
        titulo="¿Borrar definitivamente?"
        onCerrar={() => setABorrar(null)}
        pie={
          <>
            <button type="button" className="boton boton-secundario" onClick={() => setABorrar(null)}>
              Cancelar
            </button>
            <button type="button" className="boton boton-peligro" onClick={() => void borrar()}>
              Sí, borrar para siempre
            </button>
          </>
        }
      >
        <p>«{aBorrar?.titulo}» se borra para siempre. Esto no se puede deshacer.</p>
      </Dialogo>
    </div>
  );
}
