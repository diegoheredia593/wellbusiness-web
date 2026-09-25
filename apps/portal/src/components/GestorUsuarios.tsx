/**
 * Usuarios del portal (solo admin): invitar con enlace, cambiar rol,
 * activar/desactivar y generar enlace para crear una contraseña nueva.
 * Los enlaces se copian o se mandan por WhatsApp (el correo llega en la fase 3).
 */
import { useId, useState } from 'react';
import Dialogo from './Dialogo';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'editor';
  activo: boolean;
  ultimaVez: string;
  esYo: boolean;
}

interface Invitacion {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  vence: string;
}

interface Enlace {
  id: string;
  url: string;
  vence: string;
  email: string;
  nombre: string | null;
  tipo: 'invitacion' | 'restablecer';
}

interface Props {
  usuarios: Usuario[];
  invitaciones: Invitacion[];
  titulo: string;
}

function mensajeWhatsapp(e: Enlace, titulo: string) {
  const saludo = e.nombre ? `Hola ${e.nombre.split(' ')[0]}` : 'Hola';
  const texto =
    e.tipo === 'invitacion'
      ? `${saludo}, te invito al ${titulo}. Entra a este enlace para crear tu contraseña (sirve una sola vez): ${e.url}`
      : `${saludo}, aquí tienes el enlace para crear una contraseña nueva en el ${titulo} (sirve una sola vez): ${e.url}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

function VerEnlace({ enlace, titulo, onCerrar }: { enlace: Enlace | null; titulo: string; onCerrar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const id = useId();
  if (!enlace) return null;
  const vence = new Date(enlace.vence).toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });
  return (
    <Dialogo
      abierto
      titulo={enlace.tipo === 'invitacion' ? 'Invitación lista' : 'Enlace para nueva contraseña'}
      onCerrar={() => {
        setCopiado(false);
        onCerrar();
      }}
      pie={
        <button type="button" className="boton boton-primario" onClick={onCerrar}>
          Listo
        </button>
      }
    >
      <p className="mb-3">
        Mándale este enlace a <strong>{enlace.nombre ?? enlace.email}</strong>. Sirve <strong>una sola vez</strong> y vence
        el {vence}.
      </p>
      <label htmlFor={id} className="etiqueta">
        Enlace
      </label>
      <input id={id} className="campo mb-3 font-mono text-sm" readOnly value={enlace.url} onFocus={(e) => e.target.select()} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="boton boton-secundario"
          onClick={async () => {
            await navigator.clipboard.writeText(enlace.url);
            setCopiado(true);
          }}
        >
          {copiado ? 'Copiado ✓' : 'Copiar enlace'}
        </button>
        <a href={mensajeWhatsapp(enlace, titulo)} target="_blank" rel="noopener noreferrer" className="boton boton-secundario">
          Mandar por WhatsApp
        </a>
      </div>
      <p className="sr-only" aria-live="polite">
        {copiado ? 'Enlace copiado.' : ''}
      </p>
      <p className="ayuda mt-4">Cualquiera que tenga el enlace puede usarlo: mándalo solo a esa persona.</p>
    </Dialogo>
  );
}

export default function GestorUsuarios({ usuarios: iniciales, invitaciones: invIniciales, titulo }: Props) {
  const idForm = useId();
  const [usuarios, setUsuarios] = useState(iniciales);
  const [invitaciones, setInvitaciones] = useState(invIniciales);
  const [invitar, setInvitar] = useState(false);
  const [datos, setDatos] = useState({ email: '', nombre: '', rol: 'editor' as 'admin' | 'editor' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enlace, setEnlace] = useState<Enlace | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  async function llamar(url: string, metodo: string, cuerpo?: unknown) {
    setTrabajando(true);
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const c = (await r.json().catch(() => null)) as { error?: string; campos?: Record<string, string>; enlace?: Enlace } | null;
      return { ok: r.ok, ...c };
    } finally {
      setTrabajando(false);
    }
  }

  async function enviarInvitacion() {
    const r = await llamar('/api/usuarios/invitar', 'POST', datos);
    if (!r.ok) {
      setErrores(r.campos ?? {});
      setMensaje({ tipo: 'error', texto: r.error ?? 'No se pudo crear la invitación.' });
      return;
    }
    setInvitar(false);
    setErrores({});
    setMensaje(null);
    setDatos({ email: '', nombre: '', rol: 'editor' });
    setEnlace(r.enlace ?? null);
    setInvitaciones((xs) => [
      { id: r.enlace!.id, email: r.enlace!.email, nombre: r.enlace!.nombre, rol: datos.rol, vence: r.enlace!.vence },
      ...xs.filter((x) => x.email !== r.enlace!.email),
    ]);
  }

  async function cambiar(u: Usuario, cambio: { rol?: 'admin' | 'editor'; activo?: boolean }) {
    const r = await llamar(`/api/usuarios/${u.id}`, 'PATCH', cambio);
    if (!r.ok) return setMensaje({ tipo: 'error', texto: r.error ?? 'No se pudo cambiar.' });
    setUsuarios((xs) => xs.map((x) => (x.id === u.id ? { ...x, ...cambio } : x)));
    setMensaje({
      tipo: 'ok',
      texto:
        cambio.activo === false
          ? `${u.nombre} ya no puede entrar al portal.`
          : cambio.activo
            ? `${u.nombre} puede volver a entrar.`
            : `${u.nombre} ahora es ${cambio.rol === 'admin' ? 'administrador' : 'editor'}.`,
    });
  }

  async function restablecer(u: Usuario) {
    const r = await llamar(`/api/usuarios/${u.id}`, 'POST');
    if (!r.ok) return setMensaje({ tipo: 'error', texto: r.error ?? 'No se pudo generar el enlace.' });
    setEnlace(r.enlace ?? null);
  }

  async function anular(i: Invitacion) {
    const r = await llamar(`/api/usuarios/invitaciones/${i.id}`, 'DELETE');
    if (r.ok) {
      setInvitaciones((xs) => xs.filter((x) => x.id !== i.id));
      setMensaje({ tipo: 'ok', texto: `Se anuló la invitación de ${i.email}.` });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-tinta-suave">
          Los <strong>editores</strong> cambian textos, fotos y publicaciones. Los <strong>administradores</strong> además
          manejan usuarios y textos del sistema.
        </p>
        <button type="button" className="boton boton-primario" onClick={() => setInvitar(true)}>
          + Invitar a alguien
        </button>
      </div>

      <div aria-live="polite">
        {mensaje && <p className={`aviso ${mensaje.tipo === 'ok' ? 'aviso-exito' : 'aviso-error'}`}>{mensaje.texto}</p>}
      </div>

      <section aria-labelledby="t-usuarios">
        <h2 id="t-usuarios" className="mb-3 text-xl font-bold">
          Usuarios ({usuarios.length})
        </h2>
        <ul className="tarjeta divide-y divide-borde">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold">
                  {u.nombre} {u.esYo && <span className="text-sm font-normal text-tinta-suave">(tú)</span>}
                </p>
                <p className="text-sm break-all text-tinta-suave">{u.email}</p>
                <p className="mt-1 flex flex-wrap gap-2 text-sm">
                  <span className="insignia bg-info-suave">{u.rol === 'admin' ? 'Administrador' : 'Editor'}</span>
                  {!u.activo && <span className="insignia bg-peligro-suave text-peligro">Desactivado</span>}
                  <span className="text-tinta-suave">{u.ultimaVez}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`rol-${u.id}`}>
                  Rol de {u.nombre}
                </label>
                <select
                  id={`rol-${u.id}`}
                  className="campo w-auto py-1"
                  value={u.rol}
                  disabled={trabajando}
                  onChange={(e) => void cambiar(u, { rol: e.target.value as 'admin' | 'editor' })}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
                {!u.esYo && (
                  <button
                    type="button"
                    className="boton boton-secundario boton-chico"
                    disabled={trabajando}
                    onClick={() => void cambiar(u, { activo: !u.activo })}
                  >
                    {u.activo ? 'Desactivar' : 'Activar'}
                    <span className="sr-only"> a {u.nombre}</span>
                  </button>
                )}
                {u.activo && (
                  <button type="button" className="boton boton-secundario boton-chico" disabled={trabajando} onClick={() => void restablecer(u)}>
                    Enlace para nueva contraseña<span className="sr-only"> de {u.nombre}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {invitaciones.length > 0 && (
        <section aria-labelledby="t-invitaciones">
          <h2 id="t-invitaciones" className="mb-3 text-xl font-bold">
            Invitaciones sin usar
          </h2>
          <ul className="tarjeta divide-y divide-borde">
            {invitaciones.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{i.nombre ?? i.email}</p>
                  <p className="text-sm text-tinta-suave">
                    {i.email} · vence el {new Date(i.vence).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <button type="button" className="boton boton-secundario boton-chico" onClick={() => void anular(i)}>
                  Anular<span className="sr-only"> la invitación de {i.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="ayuda mt-2">Si alguien perdió su enlace, vuelve a invitarle: el enlace anterior deja de servir.</p>
        </section>
      )}

      <Dialogo
        abierto={invitar}
        titulo="Invitar a alguien"
        onCerrar={() => setInvitar(false)}
        pie={
          <>
            <button type="button" className="boton boton-secundario" onClick={() => setInvitar(false)}>
              Cancelar
            </button>
            <button type="submit" form={idForm} className="boton boton-primario" disabled={trabajando}>
              Crear enlace de invitación
            </button>
          </>
        }
      >
        <form
          id={idForm}
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void enviarInvitacion();
          }}
        >
          {mensaje?.tipo === 'error' && (
            <p role="alert" className="aviso aviso-error">
              {mensaje.texto}
            </p>
          )}
          <div>
            <label htmlFor={`${idForm}-nombre`} className="etiqueta">
              Nombre
            </label>
            <input
              id={`${idForm}-nombre`}
              className="campo"
              autoComplete="off"
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${idForm}-email`} className="etiqueta">
              Correo <span className="text-sm font-normal text-tinta-suave">(obligatorio)</span>
            </label>
            <input
              id={`${idForm}-email`}
              className="campo"
              type="email"
              autoComplete="off"
              value={datos.email}
              aria-invalid={errores.email ? true : undefined}
              aria-describedby={errores.email ? `${idForm}-email-error` : undefined}
              onChange={(e) => setDatos({ ...datos, email: e.target.value })}
            />
            {errores.email && (
              <p id={`${idForm}-email-error`} className="error-campo mt-1">
                {errores.email}
              </p>
            )}
          </div>
          <fieldset>
            <legend className="etiqueta">Rol</legend>
            {(['editor', 'admin'] as const).map((r) => (
              <label key={r} className="flex min-h-11 items-start gap-2 py-1">
                <input
                  type="radio"
                  name="rol"
                  className="mt-1 h-5 w-5 accent-acento"
                  checked={datos.rol === r}
                  onChange={() => setDatos({ ...datos, rol: r })}
                />
                <span>
                  <strong>{r === 'editor' ? 'Editor' : 'Administrador'}</strong>
                  <span className="block text-sm text-tinta-suave">
                    {r === 'editor' ? 'Edita textos, fotos y publicaciones.' : 'Además maneja usuarios y textos del sistema.'}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        </form>
      </Dialogo>

      <VerEnlace enlace={enlace} titulo={titulo} onCerrar={() => setEnlace(null)} />
    </div>
  );
}
