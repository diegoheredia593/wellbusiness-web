/**
 * Lista de una colección: filtros por estado, búsqueda, orden arrastrable
 * (o con botones Subir/Bajar) y acciones rápidas.
 */
import { useId, useMemo, useState } from 'react';
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
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { EstadoItem } from '@cms/core/schema';
import Dialogo from './Dialogo';
import { conArticulo, nuevo as textoNuevo, type Nombrable } from '@/lib/textos';

export interface ResumenItem {
  id: string;
  titulo: string;
  detalle: string | null;
  estado: EstadoItem;
  miniatura: string | null;
  actualizado: string;
  pendiente: boolean;
  /** Texto donde busca el buscador. */
  busqueda: string;
}

interface Props {
  coleccion: string;
  nombres: Nombrable & { etiqueta: string };
  items: ResumenItem[];
  ordenManual: boolean;
  puedeEliminar: boolean;
  enRevision: boolean;
  aviso?: string;
}

const FILTROS: { valor: EstadoItem | 'todos'; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'publicado', texto: 'Publicados' },
  { valor: 'borrador', texto: 'Borradores' },
  { valor: 'archivado', texto: 'Archivados' },
];

const ESTADO: Record<EstadoItem, { texto: string; clase: string }> = {
  publicado: { texto: 'Publicado', clase: 'bg-exito-suave text-exito' },
  borrador: { texto: 'Borrador', clase: 'bg-aviso-suave text-aviso' },
  archivado: { texto: 'Archivado', clase: 'border border-borde bg-fondo text-tinta-suave' },
};

const sinAcentos = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function Fila({
  item,
  coleccion,
  arrastrable,
  indice,
  total,
  onMover,
  onAccion,
  puedeEliminar,
  enRevision,
}: {
  item: ResumenItem;
  coleccion: string;
  arrastrable: boolean;
  indice: number;
  total: number;
  onMover: (delta: number) => void;
  onAccion: (a: 'publicar' | 'borrador' | 'archivar' | 'eliminar') => void;
  puedeEliminar: boolean;
  enRevision: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !arrastrable,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-3 border-b border-borde bg-white p-3 last:border-b-0 ${
        isDragging ? 'relative z-10 shadow-lg ring-2 ring-acento' : ''
      }`}
    >
      {arrastrable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md hover:bg-fondo"
          aria-label={`Mover «${item.titulo}». Usa espacio y las flechas.`}
        >
          <GripVertical aria-hidden className="h-5 w-5 text-tinta-suave" />
        </button>
      )}
      {item.miniatura ? (
        <img src={item.miniatura} alt="" className="h-12 w-16 shrink-0 rounded bg-fondo object-cover" />
      ) : null}
      <div className="min-w-0 flex-1 basis-48">
        <a href={`/colecciones/${coleccion}/${item.id}`} className="enlace block truncate text-base">
          {item.titulo}
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
          <span className={`insignia ${ESTADO[item.estado].clase}`}>{ESTADO[item.estado].texto}</span>
          {item.pendiente && <span className="insignia bg-info-suave">Cambios en revisión</span>}
          {item.detalle && <span>{item.detalle}</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {arrastrable && (
          <>
            <button type="button" className="boton boton-secundario boton-chico" disabled={indice === 0} onClick={() => onMover(-1)}>
              <span aria-hidden>↑</span>
              <span className="sr-only">Subir «{item.titulo}»</span>
            </button>
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              disabled={indice === total - 1}
              onClick={() => onMover(1)}
            >
              <span aria-hidden>↓</span>
              <span className="sr-only">Bajar «{item.titulo}»</span>
            </button>
          </>
        )}
        {!enRevision && item.estado === 'borrador' && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => onAccion('publicar')}>
            Publicar<span className="sr-only"> «{item.titulo}»</span>
          </button>
        )}
        {!enRevision && item.estado === 'publicado' && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => onAccion('archivar')}>
            Archivar<span className="sr-only"> «{item.titulo}»</span>
          </button>
        )}
        {!enRevision && item.estado === 'archivado' && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => onAccion('publicar')}>
            Restaurar<span className="sr-only"> «{item.titulo}»</span>
          </button>
        )}
        {puedeEliminar && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => onAccion('eliminar')}>
            Eliminar<span className="sr-only"> «{item.titulo}»</span>
          </button>
        )}
      </div>
    </li>
  );
}

export default function ListaColeccion(p: Props) {
  const [items, setItems] = useState(p.items);
  const [filtro, setFiltro] = useState<EstadoItem | 'todos'>('todos');
  const [buscar, setBuscar] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    p.aviso ? { tipo: 'ok', texto: p.aviso } : null,
  );
  const [aEliminar, setAEliminar] = useState<ResumenItem | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const idDnd = useId();
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibles = useMemo(() => {
    const t = sinAcentos(buscar.trim());
    return items.filter((i) => (filtro === 'todos' || i.estado === filtro) && (!t || sinAcentos(i.busqueda).includes(t)));
  }, [items, filtro, buscar]);

  const arrastrable = p.ordenManual && filtro === 'todos' && !buscar.trim();
  const cuenta = (e: EstadoItem | 'todos') => (e === 'todos' ? items.length : items.filter((i) => i.estado === e).length);

  async function guardarOrden(nuevo: ResumenItem[], descripcion: string) {
    const anterior = items;
    setItems(nuevo);
    const r = await fetch(`/api/colecciones/${p.coleccion}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden: nuevo.map((i) => i.id) }),
    });
    if (r.ok) setMensaje({ tipo: 'ok', texto: `Orden guardado. ${descripcion}` });
    else {
      setItems(anterior);
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el orden. Inténtalo de nuevo.' });
    }
  }

  function alSoltar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const desde = items.findIndex((i) => i.id === e.active.id);
    const hacia = items.findIndex((i) => i.id === e.over!.id);
    void guardarOrden(arrayMove(items, desde, hacia), `«${items[desde]!.titulo}» quedó en la posición ${hacia + 1}.`);
  }

  async function accion(item: ResumenItem, a: 'publicar' | 'borrador' | 'archivar' | 'eliminar') {
    if (a === 'eliminar') return setAEliminar(item);
    setTrabajando(true);
    const r = await fetch(`/api/colecciones/${p.coleccion}/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: a }),
    });
    setTrabajando(false);
    const c = (await r.json().catch(() => null)) as { error?: string } | null;
    if (!r.ok) return setMensaje({ tipo: 'error', texto: c?.error ?? 'No se pudo completar.' });
    const estado: EstadoItem = a === 'publicar' ? 'publicado' : a === 'archivar' ? 'archivado' : 'borrador';
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, estado } : x)));
    const verbo = { publicado: 'publicado', archivado: 'archivado', borrador: 'pasado a borrador' }[estado];
    setMensaje({ tipo: 'ok', texto: `«${item.titulo}»: ${verbo}.` });
  }

  async function eliminar() {
    if (!aEliminar) return;
    setTrabajando(true);
    const r = await fetch(`/api/colecciones/${p.coleccion}/${aEliminar.id}`, { method: 'DELETE' });
    setTrabajando(false);
    if (!r.ok) {
      setMensaje({ tipo: 'error', texto: 'No se pudo eliminar.' });
    } else {
      setItems((xs) => xs.filter((x) => x.id !== aEliminar.id));
      setMensaje({ tipo: 'ok', texto: `«${aEliminar.titulo}» se mandó a la papelera.` });
    }
    setAEliminar(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`boton boton-chico ${filtro === f.valor ? 'boton-primario' : 'boton-secundario'}`}
            >
              {f.texto} ({cuenta(f.valor)})
            </button>
          ))}
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="buscar" className="etiqueta text-sm">
            Buscar
          </label>
          <input id="buscar" type="search" className="campo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
      </div>

      <div aria-live="polite" className="mb-3">
        {mensaje && <p className={`aviso ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{mensaje.texto}</p>}
      </div>

      {p.ordenManual && !arrastrable && items.length > 1 && (
        <p className="ayuda mb-2">Para cambiar el orden, elige "Todos" y deja la búsqueda vacía.</p>
      )}
      {!p.ordenManual && <p className="ayuda mb-2">Esta lista se ordena sola por fecha, de la más reciente a la más antigua.</p>}

      {visibles.length === 0 ? (
        <div className="tarjeta p-6 text-center">
          <p className="mb-3 text-tinta-suave">
            {items.length === 0 ? `Todavía no hay ${p.nombres.etiqueta.toLowerCase()}.` : 'Nada coincide con el filtro o la búsqueda.'}
          </p>
          {items.length === 0 && (
            <a href={`/colecciones/${p.coleccion}/nuevo`} className="boton boton-primario">
              {textoNuevo(p.nombres)}
            </a>
          )}
        </div>
      ) : (
        <DndContext id={idDnd} sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={visibles.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="tarjeta overflow-hidden" aria-busy={trabajando}>
              {visibles.map((item, i) => (
                <Fila
                  key={item.id}
                  item={item}
                  coleccion={p.coleccion}
                  arrastrable={arrastrable}
                  indice={i}
                  total={visibles.length}
                  puedeEliminar={p.puedeEliminar}
                  enRevision={p.enRevision}
                  onMover={(d) =>
                    void guardarOrden(arrayMove(items, i, i + d), `«${item.titulo}» quedó en la posición ${i + d + 1}.`)
                  }
                  onAccion={(a) => void accion(item, a)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Dialogo
        abierto={!!aEliminar}
        titulo={`¿Eliminar ${conArticulo(p.nombres)}?`}
        onCerrar={() => setAEliminar(null)}
        pie={
          <>
            <button type="button" className="boton boton-secundario" onClick={() => setAEliminar(null)}>
              Cancelar
            </button>
            <button type="button" className="boton boton-peligro" disabled={trabajando} onClick={() => void eliminar()}>
              Sí, mandar a la papelera
            </button>
          </>
        }
      >
        <p>
          «{aEliminar?.titulo}» deja de verse en el sitio y va a la papelera. Durante 30 días se puede recuperar.
        </p>
      </Dialogo>
    </div>
  );
}
