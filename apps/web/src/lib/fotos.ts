/**
 * Único helper de imágenes del sitio: atributos de un `<img>` con `srcset` + `sizes` a partir de las
 * variantes (480/960/1600 px) que la plataforma genera para cada foto (sprint 6a).
 *
 * `sizes` es el ancho con que la foto se MUESTRA en cada lugar (no el de la pantalla): con él el
 * navegador elige la variante más angosta que alcance. Sin variantes (foto chica o aún sin procesar)
 * devuelve solo `src`, como siempre. `prioridad` es para la imagen principal de la página: sin
 * `lazy` y con `fetchpriority="high"`.
 *
 * Los nombres salen en minúscula (`srcset`, `fetchpriority`) para esparcirlos en un `<img>` de Astro.
 */
import { imagenResponsiva } from "./plataforma/imagen";
import type { Imagen } from "../data/types";

export interface OpcionesFoto {
  /** Atributo `sizes`: ancho con que se muestra la foto según la pantalla. Por defecto `100vw`. */
  sizes?: string | undefined;
  prioridad?: boolean | undefined;
  /** Texto alternativo propio (p. ej. '' en una imagen decorativa). Se pasa aquí y no como atributo aparte: un `<img>` con `alt` repetido usa el primero. */
  alt?: string | undefined;
  /** Carga explícita sin prioridad alta (p. ej. un carrusel que debe cargar todo). */
  carga?: 'eager' | 'lazy' | undefined;
}

function aFoto(img: Imagen) {
  return {
    src: img.src,
    alt: img.alt,
    width: img.ancho,
    height: img.alto,
    variantes: img.variantes.map((v) => ({ src: v.src, width: v.ancho, height: v.alto })),
  };
}

/** Para un `<img {...atributosFoto(img, { sizes })}>`. */
export function atributosFoto(img: Imagen, { sizes, prioridad, alt, carga }: OpcionesFoto = {}) {
  const foto = aFoto(img);
  if (alt !== undefined) foto.alt = alt;
  const { srcSet, fetchPriority, ...resto } = imagenResponsiva(foto, { sizes, prioritaria: prioridad });
  if (carga && !prioridad) resto.loading = carga;
  return { ...resto, srcset: srcSet, fetchpriority: fetchPriority };
}

/** `srcset` + `sizes` de una foto (para cambiar la imagen principal de una galería desde un script). */
export function srcsetDeFoto(img: Imagen, sizes?: string): { srcset: string; sizes: string } | undefined {
  const { srcSet, sizes: s } = imagenResponsiva(aFoto(img), { sizes });
  return srcSet && s ? { srcset: srcSet, sizes: s } : undefined;
}

/** La variante más ancha (hasta 1600 px) o el original: para el zoom, que necesita detalle pero no el archivo entero. */
export function urlMasNitida(img: Imagen): string {
  const mayor = [...img.variantes].sort((a, b) => b.ancho - a.ancho)[0];
  return mayor && mayor.ancho >= img.ancho ? img.src : (mayor?.src ?? img.src);
}
