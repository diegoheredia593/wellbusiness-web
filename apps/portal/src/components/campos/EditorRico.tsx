/**
 * Editor de texto enriquecido (Tiptap), limitado a lo que admite el modelo:
 * párrafos, listas, negrita, cursiva y enlaces (rutas internas, https:,
 * mailto: y tel:). Guarda el JSON estructurado del CMS, nunca HTML.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import { UndoRedo } from '@tiptap/extensions';
import { aEditor, desdeEditor, PATRON_ENLACE, type NodoEditor } from '@cms/core/rico';
import { textoPlano, type TextoEnriquecido } from '@cms/core/schema';
import { Bold as IconoNegrita, Italic as IconoCursiva, Link2, List, ListOrdered, Unlink } from 'lucide-react';

interface Props {
  id: string;
  valor: TextoEnriquecido | null;
  onCambio: (valor: TextoEnriquecido) => void;
  describedBy?: string;
  invalido?: boolean;
  etiquetaAccesible: string;
}

/** Evita que en el editor se escriban listas dentro de listas. */
const ListItemSimple = ListItem.extend({ content: 'paragraph' });

function Boton({
  activo,
  onClick,
  etiqueta,
  children,
  deshabilitado,
}: {
  activo?: boolean;
  onClick: () => void;
  etiqueta: string;
  children: React.ReactNode;
  deshabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-pressed={activo === undefined ? undefined : activo}
      title={etiqueta}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold hover:bg-fondo disabled:opacity-40 ${
        activo ? 'bg-acento-suave text-acento-oscuro ring-1 ring-acento' : ''
      }`}
    >
      {children}
      <span className="sr-only">{etiqueta}</span>
    </button>
  );
}

function BarraEnlace({ editor, onCerrar }: { editor: Editor; onCerrar: () => void }) {
  const id = useId();
  const actual = (editor.getAttributes('link').href as string | undefined) ?? '';
  const [url, setUrl] = useState(actual);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  function aplicar() {
    const limpio = url.trim();
    if (!limpio) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      onCerrar();
      return;
    }
    const final = /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(limpio) ? `https://${limpio}` : limpio;
    if (!PATRON_ENLACE.test(final)) {
      setError('Usa una página del sitio (/contacto), una dirección https://, mailto:correo o tel:número.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: final }).run();
    onCerrar();
  }

  return (
    <div className="border-b border-borde bg-fondo p-3">
      <label htmlFor={id} className="etiqueta text-sm">
        Dirección del enlace
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          ref={ref}
          id={id}
          className="campo min-w-0 flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              aplicar();
            }
            if (e.key === 'Escape') onCerrar();
          }}
          placeholder="/contacto o https://…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="button" className="boton boton-primario boton-chico" onClick={aplicar}>
          Aplicar
        </button>
        <button type="button" className="boton boton-secundario boton-chico" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="error-campo mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default function EditorRico({ id, valor, onCambio, describedBy, invalido, etiquetaAccesible }: Props) {
  const [enlaceAbierto, setEnlaceAbierto] = useState(false);
  const [, forzar] = useState(0);
  const inicial = useRef(valor);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      BulletList,
      OrderedList,
      ListItemSimple,
      UndoRedo,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        protocols: ['mailto', 'tel'],
        HTMLAttributes: { rel: null, target: null },
        isAllowedUri: (url) => PATRON_ENLACE.test(url),
      }),
    ],
    content: aEditor(inicial.current) as never,
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': etiquetaAccesible,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(invalido ? { 'aria-invalid': 'true' } : {}),
        class: 'rico min-h-40 px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onCambio(desdeEditor(editor.getJSON() as NodoEditor)),
    onSelectionUpdate: () => forzar((n) => n + 1),
    onTransaction: () => forzar((n) => n + 1),
  });

  // Si el valor cambia desde afuera (p. ej. "Descartar cambios"), recargar el editor.
  useEffect(() => {
    if (!editor) return;
    const actual = JSON.stringify(desdeEditor(editor.getJSON() as NodoEditor));
    if (actual !== JSON.stringify(valor ?? [])) editor.commands.setContent(aEditor(valor) as never, { emitUpdate: false });
  }, [valor, editor]);

  useEffect(() => {
    if (!editor) return;
    const attrs = editor.view.dom;
    if (describedBy) attrs.setAttribute('aria-describedby', describedBy);
    else attrs.removeAttribute('aria-describedby');
    if (invalido) attrs.setAttribute('aria-invalid', 'true');
    else attrs.removeAttribute('aria-invalid');
  }, [editor, describedBy, invalido]);

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white focus-within:outline-3 focus-within:outline-offset-1 focus-within:outline-acento ${
        invalido ? 'border-peligro' : 'border-borde-campo'
      }`}
    >
      <div role="toolbar" aria-label={`Formato de ${etiquetaAccesible}`} aria-controls={id} className="flex flex-wrap gap-1 border-b border-borde p-1">
        <Boton etiqueta="Negrita" activo={editor?.isActive('bold') ?? false} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <IconoNegrita aria-hidden className="h-4 w-4" />
        </Boton>
        <Boton etiqueta="Cursiva" activo={editor?.isActive('italic') ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <IconoCursiva aria-hidden className="h-4 w-4" />
        </Boton>
        <Boton
          etiqueta="Lista con viñetas"
          activo={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden className="h-4 w-4" />
        </Boton>
        <Boton
          etiqueta="Lista numerada"
          activo={editor?.isActive('orderedList') ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden className="h-4 w-4" />
        </Boton>
        <Boton etiqueta="Agregar o cambiar enlace" activo={editor?.isActive('link') ?? false} onClick={() => setEnlaceAbierto(true)}>
          <Link2 aria-hidden className="h-4 w-4" />
        </Boton>
        <Boton
          etiqueta="Quitar enlace"
          deshabilitado={!editor?.isActive('link')}
          onClick={() => editor?.chain().focus().extendMarkRange('link').unsetLink().run()}
        >
          <Unlink aria-hidden className="h-4 w-4" />
        </Boton>
      </div>
      {enlaceAbierto && editor && <BarraEnlace editor={editor} onCerrar={() => setEnlaceAbierto(false)} />}
      <EditorContent editor={editor} />
    </div>
  );
}

/** Caracteres de texto (sin formato) de un valor enriquecido. */
export function largoRico(valor: TextoEnriquecido | null) {
  return valor ? textoPlano(valor).length : 0;
}
