/**
 * Galería de fotos: agregar varias, ordenar arrastrando (o con los botones
 * "Antes"/"Después", accesibles con teclado), editar el texto alternativo y quitar.
 */
import { useId, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Imagen } from '@cms/core/schema';
import SubirVarias from '../fotos/SubirVarias';
import { verSrc } from '@/lib/cliente/imagenes';

interface Props {
  id: string;
  valor: Imagen[];
  onCambio: (v: Imagen[]) => void;
  describedBy?: string;
}

/** Claves estables al reordenar: la foto y cuántas veces apareció antes (puede repetirse). */
function clavesDe(imagenes: Imagen[]) {
  const vistas = new Map<string, number>();
  return imagenes.map((img) => {
    const base = img.medio ?? img.src;
    const n = vistas.get(base) ?? 0;
    vistas.set(base, n + 1);
    return `${base}#${n}`;
  });
}

function Foto({
  img,
  clave,
  indice,
  total,
  onAlt,
  onQuitar,
  onMover,
}: {
  img: Imagen;
  clave: string;
  indice: number;
  total: number;
  onAlt: (alt: string) => void;
  onQuitar: () => void;
  onMover: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: clave });
  const idAlt = `${clave}-alt`;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-borde bg-white p-2 ${isDragging ? 'z-10 shadow-lg ring-2 ring-acento' : ''}`}
    >
      <div className="relative">
        <img src={verSrc(img.src)} alt="" loading="lazy" className="aspect-[4/3] w-full rounded bg-fondo object-cover" />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 inline-flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded-md bg-white/95 shadow"
          aria-label={`Mover la foto ${indice + 1}. Usa espacio y las flechas para moverla.`}
        >
          <GripVertical aria-hidden className="h-4 w-4" />
        </button>
        <span className="absolute top-1 right-1 rounded bg-tinta/80 px-1.5 text-sm font-bold text-white">{indice + 1}</span>
      </div>
      <label htmlFor={idAlt} className="mt-2 block text-sm font-semibold">
        Texto alternativo
      </label>
      <textarea
        id={idAlt}
        className="campo min-h-14 text-sm"
        value={img.alt}
        maxLength={250}
        aria-invalid={img.alt.trim().length < 5 ? true : undefined}
        onChange={(e) => onAlt(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        <button type="button" className="boton boton-secundario boton-chico" disabled={indice === 0} onClick={() => onMover(-1)}>
          Antes
        </button>
        <button type="button" className="boton boton-secundario boton-chico" disabled={indice === total - 1} onClick={() => onMover(1)}>
          Después
        </button>
        <button type="button" className="boton boton-texto boton-chico" onClick={onQuitar}>
          Quitar
        </button>
      </div>
    </li>
  );
}

export default function CampoGaleria({ id, valor, onCambio, describedBy }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const idDnd = useId();
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const claves = clavesDe(valor);

  function alSoltar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const desde = claves.indexOf(String(e.active.id));
    const hacia = claves.indexOf(String(e.over.id));
    onCambio(arrayMove(valor, desde, hacia));
    setAviso(`Foto movida a la posición ${hacia + 1}.`);
  }

  return (
    <div id={id} aria-describedby={describedBy}>
      <p className="sr-only" aria-live="polite">
        {aviso}
      </p>
      {valor.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borde-campo p-4 text-tinta-suave">Todavía no hay fotos.</p>
      ) : (
        <DndContext id={idDnd} sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={claves} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {valor.map((img, i) => (
                <Foto
                  key={claves[i]}
                  clave={claves[i]!}
                  img={img}
                  indice={i}
                  total={valor.length}
                  onAlt={(alt) => onCambio(valor.map((x, j) => (j === i ? { ...x, alt } : x)))}
                  onQuitar={() => {
                    onCambio(valor.filter((_, j) => j !== i));
                    setAviso(`Foto ${i + 1} quitada de la galería.`);
                  }}
                  onMover={(delta) => {
                    onCambio(arrayMove(valor, i, i + delta));
                    setAviso(`Foto movida a la posición ${i + delta + 1}.`);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={() => setAbierto(true)}>
          Agregar fotos
        </button>
        <span className="ayuda">
          {valor.length} {valor.length === 1 ? 'foto' : 'fotos'}
        </span>
      </div>
      <SubirVarias
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onAgregar={(nuevas) => {
          onCambio([...valor, ...nuevas]);
          setAviso(`${nuevas.length} fotos agregadas.`);
          setAbierto(false);
        }}
      />
    </div>
  );
}
