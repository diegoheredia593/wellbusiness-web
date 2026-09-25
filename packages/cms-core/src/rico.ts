/**
 * Conversión entre el texto enriquecido del CMS y el documento del editor
 * (formato ProseMirror/Tiptap). El CMS nunca guarda HTML: el editor trabaja
 * con su propio JSON y al guardar se convierte a nuestro modelo estructurado.
 *
 * Solo se conservan párrafos, listas, negrita, cursiva y enlaces permitidos.
 * Todo lo demás (encabezados, listas anidadas, saltos de línea) se aplana.
 */
import type { Inline, Nodo, TextoEnriquecido } from './schema';

export const PATRON_ENLACE = /^(\/|https:\/\/|mailto:|tel:)/;

interface Marca {
  type: string;
  attrs?: Record<string, unknown>;
}
export interface NodoEditor {
  type: string;
  text?: string;
  marks?: Marca[];
  attrs?: Record<string, unknown>;
  content?: NodoEditor[];
}

// ─── Modelo → editor ───────────────────────────────────────────────────────

function inlinesAEditor(inlines: Inline[]): NodoEditor[] {
  return inlines
    .filter((i) => i.texto.length > 0)
    .map((i) => {
      const marks: Marca[] = [];
      if (i.negrita) marks.push({ type: 'bold' });
      if (i.cursiva) marks.push({ type: 'italic' });
      if (i.enlace) marks.push({ type: 'link', attrs: { href: i.enlace } });
      return { type: 'text', text: i.texto, ...(marks.length ? { marks } : {}) };
    });
}

function parrafo(inlines: Inline[]): NodoEditor {
  const content = inlinesAEditor(inlines);
  return { type: 'paragraph', ...(content.length ? { content } : {}) };
}

export function aEditor(valor: TextoEnriquecido | null): NodoEditor {
  const content = (valor ?? []).map((n): NodoEditor => {
    if (n.tipo === 'parrafo') return parrafo(n.contenido);
    return {
      type: n.ordenada ? 'orderedList' : 'bulletList',
      content: n.items.map((item) => ({ type: 'listItem', content: [parrafo(item)] })),
    };
  });
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

// ─── Editor → modelo ───────────────────────────────────────────────────────

function textoAInlines(nodos: NodoEditor[] = []): Inline[] {
  const salida: Inline[] = [];
  for (const nodo of nodos) {
    if (nodo.type === 'hardBreak') {
      salida.push({ texto: ' ' });
      continue;
    }
    if (nodo.type !== 'text' || !nodo.text) {
      salida.push(...textoAInlines(nodo.content));
      continue;
    }
    const inline: Inline = { texto: nodo.text };
    for (const m of nodo.marks ?? []) {
      if (m.type === 'bold') inline.negrita = true;
      if (m.type === 'italic') inline.cursiva = true;
      const href = typeof m.attrs?.href === 'string' ? m.attrs.href.trim() : '';
      if (m.type === 'link' && PATRON_ENLACE.test(href)) inline.enlace = href;
    }
    salida.push(inline);
  }
  return unirIguales(salida);
}

/** Une fragmentos consecutivos con el mismo formato. */
function unirIguales(inlines: Inline[]): Inline[] {
  const r: Inline[] = [];
  for (const i of inlines) {
    const prev = r[r.length - 1];
    if (prev && prev.negrita === i.negrita && prev.cursiva === i.cursiva && prev.enlace === i.enlace) {
      prev.texto += i.texto;
    } else r.push({ ...i });
  }
  return r;
}

function vacio(inlines: Inline[]) {
  return inlines.every((i) => i.texto.trim() === '');
}

export function desdeEditor(doc: NodoEditor): TextoEnriquecido {
  const salida: Nodo[] = [];
  for (const nodo of doc.content ?? []) {
    if (nodo.type === 'bulletList' || nodo.type === 'orderedList') {
      // Cada ítem se aplana a una línea (las listas anidadas no están permitidas).
      const items = (nodo.content ?? []).map((li) => textoAInlines(li.content)).filter((i) => !vacio(i));
      if (items.length) salida.push({ tipo: 'lista', ordenada: nodo.type === 'orderedList', items });
      continue;
    }
    const inlines = textoAInlines(nodo.content);
    if (!vacio(inlines)) salida.push({ tipo: 'parrafo', contenido: inlines });
  }
  return salida;
}
