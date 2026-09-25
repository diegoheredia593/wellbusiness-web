/**
 * Ventana modal accesible basada en <dialog>: atrapa el foco, se cierra con
 * Escape y devuelve el foco al elemento que la abrió.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'normal' | 'grande';
}

export default function Dialogo({ abierto, titulo, onCerrar, children, pie, ancho = 'normal' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const anterior = useRef<Element | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      anterior.current = document.activeElement;
      d.showModal();
    } else if (!abierto && d.open) {
      d.close();
      (anterior.current as HTMLElement | null)?.focus?.();
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className={`m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] rounded-xl border border-borde bg-white p-0 text-tinta shadow-2xl backdrop:bg-black/50 ${
        ancho === 'grande' ? 'max-w-4xl' : 'max-w-lg'
      }`}
    >
      {abierto && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-borde px-5 py-3">
            <h2 id={idTitulo} className="text-lg font-bold">
              {titulo}
            </h2>
            <button type="button" onClick={onCerrar} className="boton boton-secundario boton-chico" aria-label="Cerrar">
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {pie && <div className="flex flex-wrap justify-end gap-2 border-t border-borde px-5 py-3">{pie}</div>}
        </div>
      )}
    </dialog>
  );
}
