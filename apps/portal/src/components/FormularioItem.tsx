/**
 * Crear o editar un elemento de una colección. Los campos se generan desde
 * el esquema del cliente; los botones dependen del estado y del rol.
 */
import { useMemo, useRef, useState } from 'react';
import type { Campo } from '@cms/core/campos';
import { crearSlug } from '@cms/core/slug';
import type { EstadoItem } from '@cms/core/schema';
import CampoGenerado, { idDe, type OpcionRelacion } from './campos/CampoGenerado';
import Dialogo from './Dialogo';
import { useAvisoAlSalir } from '@/lib/cliente/usar-aviso-salir';
import { conArticulo, participio, type Nombrable } from '@/lib/textos';

interface Props {
  coleccion: string;
  nombres: Nombrable & { etiqueta: string };
  campos: Campo[];
  valores: Record<string, unknown>;
  /** Cambios pendientes de aprobación (se muestran en lugar de los publicados). */
  pendientes: Record<string, unknown> | null;
  id?: string;
  estado?: EstadoItem;
  relaciones: Record<string, OpcionRelacion[]>;
  esAdmin: boolean;
  enRevision: boolean;
  puedeEliminar: boolean;
}

type Accion = 'guardar' | 'borrador' | 'publicar' | 'archivar';

const ESTADOS: Record<EstadoItem, { texto: string; clase: string }> = {
  publicado: { texto: 'Publicado', clase: 'bg-exito-suave text-exito' },
  borrador: { texto: 'Borrador', clase: 'bg-aviso-suave text-aviso' },
  archivado: { texto: 'Archivado', clase: 'bg-fondo text-tinta-suave border border-borde' },
};

export default function FormularioItem(p: Props) {
  const inicial = useMemo(() => p.pendientes ?? p.valores, [p.pendientes, p.valores]);
  const [valores, setValores] = useState<Record<string, unknown>>(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [estado, setEstado] = useState<EstadoItem>(p.estado ?? 'borrador');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  // Un slug nuevo sigue al título hasta que alguien lo edite a mano.
  const [slugManual, setSlugManual] = useState(!!p.id);
  const refMensaje = useRef<HTMLDivElement>(null);

  const nuevo = !p.id;
  const sucio = JSON.stringify(valores) !== JSON.stringify(guardado);
  useAvisoAlSalir(sucio);
  const cual = conArticulo(p.nombres);
  const lista = `/colecciones/${p.coleccion}`;

  function cambiar(nombre: string, v: unknown) {
    setValores((actual) => {
      const nuevoValor = { ...actual, [nombre]: v };
      if (!slugManual) {
        for (const c of p.campos) {
          if (c.control === 'slug' && c.desde === nombre && typeof v === 'string') nuevoValor[c.nombre] = crearSlug(v);
        }
      }
      return nuevoValor;
    });
  }

  function mostrar(tipo: 'ok' | 'error', texto: string) {
    setMensaje({ tipo, texto });
    requestAnimationFrame(() => refMensaje.current?.focus());
  }

  async function enviar(accion: Accion) {
    setTrabajando(true);
    setMensaje(null);
    const estadoPedido: EstadoItem =
      accion === 'publicar' ? 'publicado' : accion === 'borrador' ? 'borrador' : accion === 'archivar' ? 'archivado' : estado;
    try {
      const r = await fetch(nuevo ? `/api/colecciones/${p.coleccion}` : `/api/colecciones/${p.coleccion}/${p.id}`, {
        method: nuevo ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos: valores, estado: estadoPedido }),
      });
      const c = (await r.json().catch(() => null)) as {
        id?: string;
        error?: string;
        campos?: Record<string, string>;
        revision?: boolean;
      } | null;
      if (!r.ok) {
        setErrores(c?.campos ?? {});
        mostrar('error', c?.error ?? 'No se pudo guardar.');
        const primero = Object.keys(c?.campos ?? {})[0];
        if (primero) requestAnimationFrame(() => document.getElementById(idDe(primero))?.focus());
        return;
      }
      setErrores({});
      setGuardado(valores);
      if (nuevo && c?.id) {
        // Pasar a la dirección del elemento creado.
        location.replace(`${lista}/${c.id}?creado=1`);
        return;
      }
      if (c?.revision) {
        mostrar('ok', 'Cambios enviados a revisión. Un administrador los publicará.');
        return;
      }
      setEstado(estadoPedido);
      const textos: Record<Accion, string> = {
        guardar: 'Cambios guardados.',
        borrador: `${participio(p.nombres, 'Guardad')} como borrador. No se muestra en el sitio.`,
        publicar: `${participio(p.nombres, 'Publicad')}.`,
        archivar: `${participio(p.nombres, 'Archivad')}. Ya no se muestra en el sitio; puedes restaurar${p.nombres.genero === 'f' ? 'la' : 'lo'} cuando quieras.`,
      };
      mostrar('ok', textos[accion]);
    } catch {
      mostrar('error', 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setTrabajando(false);
    }
  }

  async function revision(aprobar: boolean) {
    const r = await fetch(`/api/colecciones/${p.coleccion}/${p.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: aprobar ? 'aprobar' : 'descartar' }),
    });
    if (r.ok) location.reload();
    else mostrar('error', ((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? 'No se pudo.');
  }

  async function eliminar() {
    setTrabajando(true);
    const r = await fetch(`/api/colecciones/${p.coleccion}/${p.id}`, { method: 'DELETE' });
    if (r.ok) {
      setGuardado(valores);
      location.assign(`${lista}?eliminado=1`);
    } else {
      setConfirmarEliminar(false);
      setTrabajando(false);
      mostrar('error', ((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? 'No se pudo eliminar.');
    }
  }

  const botones: { accion: Accion; texto: string; primario?: boolean }[] = p.enRevision
    ? nuevo || estado === 'borrador'
      ? [{ accion: 'borrador', texto: 'Guardar borrador', primario: true }]
      : [{ accion: 'guardar', texto: 'Enviar cambios a revisión', primario: true }]
    : nuevo || estado === 'borrador'
      ? [
          { accion: 'borrador', texto: 'Guardar borrador' },
          { accion: 'publicar', texto: 'Publicar', primario: true },
        ]
      : estado === 'publicado'
        ? [
            { accion: 'guardar', texto: 'Guardar cambios', primario: true },
            { accion: 'borrador', texto: 'Pasar a borrador' },
            { accion: 'archivar', texto: 'Archivar' },
          ]
        : [
            { accion: 'guardar', texto: 'Guardar' },
            { accion: 'publicar', texto: 'Restaurar y publicar', primario: true },
          ];

  return (
    <div className="pb-28">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {!nuevo && <span className={`insignia ${ESTADOS[estado].clase}`}>{ESTADOS[estado].texto}</span>}
        {p.pendientes && <span className="insignia bg-info-suave">Cambios en revisión</span>}
      </div>

      <div ref={refMensaje} tabIndex={-1} aria-live="polite" className="outline-none">
        {mensaje && (
          <p className={`aviso mb-5 ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>
            {mensaje.texto}{' '}
            {mensaje.tipo === 'ok' && (
              <a href={lista} className="enlace">
                Volver a la lista
              </a>
            )}
          </p>
        )}
      </div>

      {p.esAdmin && p.pendientes && (
        <div className="aviso aviso-advertencia mb-6 flex flex-wrap items-center justify-between gap-3">
          <p>Un editor propuso cambios. Los ves en el formulario. ¿Los publicamos?</p>
          <div className="flex gap-2">
            <button type="button" className="boton boton-primario boton-chico" onClick={() => void revision(true)}>
              Aprobar y publicar
            </button>
            <button type="button" className="boton boton-secundario boton-chico" onClick={() => void revision(false)}>
              Descartar
            </button>
          </div>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(botones.find((b) => b.primario)?.accion ?? 'guardar');
        }}
        className="tarjeta space-y-6 p-4 sm:p-6"
      >
        {p.campos.map((c) => (
          <CampoGenerado
            key={c.nombre}
            campo={c}
            valor={valores[c.nombre]}
            onCambio={(v) => cambiar(c.nombre, v)}
            errores={errores}
            ruta={c.nombre}
            relaciones={p.relaciones}
            onSlugManual={() => setSlugManual(true)}
          />
        ))}
        {!nuevo && p.puedeEliminar && (
          <div className="border-t border-borde pt-5">
            <button type="button" className="boton boton-secundario text-peligro" onClick={() => setConfirmarEliminar(true)}>
              Eliminar {p.nombres.singular}
            </button>
            <p className="ayuda mt-1">Va a la papelera. Se puede recuperar durante 30 días.</p>
          </div>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borde bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold" aria-live="polite">
            {sucio ? 'Hay cambios sin guardar' : nuevo ? 'Todavía no se guardó' : 'Todo guardado'}
          </p>
          <div className="flex flex-wrap gap-2">
            {botones.map((b) => (
              <button
                key={b.accion}
                type="button"
                disabled={trabajando}
                className={`boton ${b.primario ? 'boton-primario' : 'boton-secundario'}`}
                onClick={() => void enviar(b.accion)}
              >
                {trabajando && b.primario ? 'Guardando…' : b.texto}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialogo
        abierto={confirmarEliminar}
        titulo={`¿Eliminar ${cual}?`}
        onCerrar={() => setConfirmarEliminar(false)}
        pie={
          <>
            <button type="button" className="boton boton-secundario" onClick={() => setConfirmarEliminar(false)}>
              Cancelar
            </button>
            <button type="button" className="boton boton-peligro" disabled={trabajando} onClick={() => void eliminar()}>
              Sí, mandar a la papelera
            </button>
          </>
        }
      >
        <p>Deja de verse en el sitio y va a la papelera. Durante 30 días se puede recuperar desde "Papelera".</p>
      </Dialogo>
    </div>
  );
}
