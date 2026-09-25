/** Botones de la pantalla "Contenido inicial" (solo admin). */
import { useState } from 'react';

interface Props {
  items: number;
  disponibles: number;
  enviosEjemplo: number;
}

export default function AccionesCarga({ items, disponibles, enviosEjemplo }: Props) {
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [confirmacion, setConfirmacion] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  async function hacer(accion: string, exito: string) {
    setTrabajando(true);
    setMensaje(null);
    const r = await fetch('/api/carga-inicial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, confirmacion }),
    });
    const c = (await r.json().catch(() => null)) as { error?: string; cargados?: number } | null;
    setTrabajando(false);
    if (!r.ok) return setMensaje({ tipo: 'error', texto: c?.error ?? 'No se pudo completar.' });
    setMensaje({ tipo: 'ok', texto: exito.replace('{n}', String(c?.cargados ?? '')) });
    setTimeout(() => location.reload(), 1200);
  }

  return (
    <div className="space-y-6">
      <div aria-live="polite">
        {mensaje && (
          <p className={`aviso whitespace-pre-line ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{mensaje.texto}</p>
        )}
      </div>

      <section className="tarjeta p-5">
        <h2 className="mb-2 text-lg font-bold">Colecciones</h2>
        <p className="mb-4 text-tinta-suave">
          Hay {items} elementos en la base. El contenido inicial tiene {disponibles}.
        </p>
        {items === 0 ? (
          <button
            type="button"
            className="boton boton-primario"
            disabled={trabajando}
            onClick={() => void hacer('cargar', 'Listo: se cargaron {n} elementos.')}
          >
            Cargar contenido inicial
          </button>
        ) : (
          <div>
            <p className="aviso aviso-advertencia mb-3">
              "Reemplazar todo" borra todas las noticias, aliados, cifras y demás elementos (también los creados en el
              portal) y vuelve a cargar el contenido inicial. No se puede deshacer.
            </p>
            <label htmlFor="confirmacion" className="etiqueta">
              Para confirmar, escribe REEMPLAZAR
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="confirmacion"
                className="campo max-w-60"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="boton boton-peligro"
                disabled={trabajando || confirmacion.trim().toUpperCase() !== 'REEMPLAZAR'}
                onClick={() => void hacer('reemplazar', 'Listo: se reemplazó el contenido ({n} elementos).')}
              >
                Reemplazar todo
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="tarjeta p-5">
        <h2 className="mb-2 text-lg font-bold">Formularios de ejemplo</h2>
        <p className="mb-4 text-tinta-suave">
          Envíos inventados para conocer la pantalla "Formularios recibidos" mientras el sitio no guarda envíos reales.
          Ahora hay {enviosEjemplo}.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="boton boton-secundario"
            disabled={trabajando}
            onClick={() => void hacer('ejemplos', 'Se agregaron envíos de ejemplo.')}
          >
            Agregar ejemplos
          </button>
          {enviosEjemplo > 0 && (
            <button
              type="button"
              className="boton boton-secundario"
              disabled={trabajando}
              onClick={() => void hacer('sin-ejemplos', 'Se borraron los envíos de ejemplo.')}
            >
              Borrar ejemplos
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
