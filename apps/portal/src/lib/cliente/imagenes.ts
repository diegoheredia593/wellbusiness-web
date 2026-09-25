/**
 * Procesamiento de fotos en el navegador, antes de subirlas:
 * - corrige la orientación de las fotos del celular,
 * - recorta a la proporción del campo (si tiene),
 * - reduce a 2000 px como máximo en el lado largo,
 * - convierte a WebP (o JPEG si el navegador no sabe generar WebP, p. ej. Safari antiguo).
 */

export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];
export const PESO_MAXIMO_ORIGINAL = 25 * 1024 * 1024;
export const LADO_MAXIMO = 2000;
/** Igual que el límite del servidor, tras convertir. */
export const PESO_MAXIMO_SUBIDA = 2 * 1024 * 1024;

export interface Recorte {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FotoProcesada {
  blob: Blob;
  ancho: number;
  alto: number;
  tipo: string;
  nombre: string;
  /** URL local para vista previa (liberar con URL.revokeObjectURL). */
  vista: string;
}

export function problemaArchivo(archivo: File): string | null {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    return `«${archivo.name}» no es una foto JPG, PNG o WebP. Si es del iPhone (HEIC), compártela como JPG o haz una captura.`;
  }
  if (archivo.size > PESO_MAXIMO_ORIGINAL) return `«${archivo.name}» pesa más de 25 MB.`;
  return null;
}

/** Proporción "4:5" → 0.8. `null` = libre. */
export function aspecto(proporcion: string | null | undefined): number | null {
  if (!proporcion) return null;
  const [a, b] = proporcion.split(':').map(Number);
  return a && b ? a / b : null;
}

export async function cargarBitmap(fuente: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(fuente, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('No se pudo abrir la foto. Prueba con otra o guárdala como JPG.');
  }
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number) {
  return new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, calidad));
}

/** Recorte centrado con la proporción pedida (cuando no se eligió uno a mano). */
export function recorteCentrado(ancho: number, alto: number, relacion: number | null): Recorte {
  if (!relacion) return { x: 0, y: 0, width: ancho, height: alto };
  if (ancho / alto > relacion) {
    const w = Math.round(alto * relacion);
    return { x: Math.round((ancho - w) / 2), y: 0, width: w, height: alto };
  }
  const h = Math.round(ancho / relacion);
  return { x: 0, y: Math.round((alto - h) / 2), width: ancho, height: h };
}

export async function procesarFoto(fuente: Blob, nombre: string, recorte?: Recorte): Promise<FotoProcesada> {
  const bitmap = await cargarBitmap(fuente);
  const r = recorte ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const escala = Math.min(1, LADO_MAXIMO / Math.max(r.width, r.height));
  const ancho = Math.max(1, Math.round(r.width * escala));
  const alto = Math.max(1, Math.round(r.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no puede procesar fotos.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, r.x, r.y, r.width, r.height, 0, 0, ancho, alto);
  bitmap.close();

  let blob = await aBlob(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await aBlob(canvas, 'image/jpeg', 0.85);
  // Fotos con mucho detalle: bajar la calidad antes de rechazarlas.
  for (const calidad of [0.72, 0.62]) {
    if (!blob || blob.size <= PESO_MAXIMO_SUBIDA) break;
    blob = await aBlob(canvas, blob.type, calidad);
  }
  if (!blob) throw new Error('No se pudo convertir la foto.');
  if (blob.size > PESO_MAXIMO_SUBIDA) throw new Error('La foto sigue pesando más de 2 MB después de reducirla. Prueba con otra.');
  const base = nombre.replace(/\.[^.]+$/, '');
  return {
    blob,
    ancho,
    alto,
    tipo: blob.type,
    nombre: `${base}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`,
    vista: URL.createObjectURL(blob),
  };
}

export interface MedioSubido {
  id: string;
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  nombre: string;
  peso: number;
  creado: string;
}

export async function subirFoto(foto: FotoProcesada, alt: string): Promise<MedioSubido> {
  const datos = new FormData();
  datos.append('archivo', foto.blob, foto.nombre);
  datos.append('alt', alt.trim());
  const r = await fetch('/api/medios', { method: 'POST', body: datos });
  const cuerpo = (await r.json().catch(() => null)) as { medio?: MedioSubido; error?: string } | null;
  if (!r.ok || !cuerpo?.medio) throw new Error(cuerpo?.error ?? 'No se pudo subir la foto. Inténtalo de nuevo.');
  // Copia local propia (quien llamó puede liberar la suya).
  vistasLocales.set(cuerpo.medio.src, URL.createObjectURL(foto.blob));
  return cuerpo.medio;
}

/**
 * Fotos recién subidas en esta pestaña. El almacén puede tardar en tenerlas
 * disponibles en todas partes, así que durante la sesión se muestra la copia
 * del navegador en lugar de pedirla enseguida al servidor.
 */
const vistasLocales = new Map<string, string>();

/** `src` para mostrar una foto en el portal: la copia local si existe. */
export function verSrc(src: string) {
  return vistasLocales.get(src) ?? src;
}

/** Ayuda para escribir el texto alternativo. */
export const AYUDA_ALT =
  'Describe lo que se ve, como se lo contarías a alguien por teléfono: quiénes están, qué hacen y dónde. No empieces con "foto de". Ejemplo: "Niñas y niños con sus mochilas nuevas en el patio de la escuela".';
