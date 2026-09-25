import type { MarqueeLogo } from "./types";

/**
 * Technology/equipment brands shown via LogoMarquee — real logo files
 * supplied under `images/testimonios sin fondo/`, trimmed to their own
 * bounding box and copied to `public/images/logos/` (never recolored/
 * altered). Used on the homepage ("Tecnología y marcas con las que
 * trabajamos") and on /nosotros ("Marcas que han confiado en nosotros",
 * confirmed by Wellbusiness) — not a claim of official partnership/
 * certification for any brand other than Motorola, whose dealer status is
 * handled separately and explicitly (see `MOTOROLA_DEALER_LABEL` in
 * `site.ts`).
 */
export const PARTNER_LOGOS: MarqueeLogo[] = [
  { src: "/images/logos/claro.png", alt: "Claro" },
  { src: "/images/logos/grandstream.png", alt: "Grandstream" },
  { src: "/images/logos/huawei.png", alt: "Huawei" },
  { src: "/images/logos/hustler.png", alt: "Hustler" },
  { src: "/images/logos/l-com-global.png", alt: "L-com" },
  { src: "/images/logos/motorola-waveptx.png", alt: "Motorola WAVE PTX" },
  { src: "/images/logos/pctel.png", alt: "PCTEL" },
  { src: "/images/logos/rf-elements.png", alt: "RF Elements" },
  { src: "/images/logos/sinclair.png", alt: "Sinclair" },
  { src: "/images/logos/smartptt.png", alt: "SmartPTT" },
  { src: "/images/logos/tassta.png", alt: "Tassta" },
  { src: "/images/logos/telosystems.png", alt: "TeloSystems" },
  { src: "/images/logos/telox.png", alt: "Telox" },
  { src: "/images/logos/tram-browning.png", alt: "Tram Browning" },
  { src: "/images/logos/zetron.png", alt: "Zetron" },
];
