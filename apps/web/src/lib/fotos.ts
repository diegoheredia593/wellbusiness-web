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
export function atributosFoto(img: Imagen, { sizes, prioridad }: OpcionesFoto = {}) {
  const { srcSet, fetchPriority, ...resto } = imagenResponsiva(aFoto(img), { sizes, prioritaria: prioridad });
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
