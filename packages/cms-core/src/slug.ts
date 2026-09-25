/** Convierte un texto en dirección de página: "Canastas navideñas 2025" → "canastas-navidenas-2025". */
export function crearSlug(texto: string, max = 80): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

export const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
