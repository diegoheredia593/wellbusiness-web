import type { Product, ProductCategory } from "./types";

/**
 * Motorola catalog data — real entries, transcribed and lightly rewritten
 * (for a less technical `summary`, never a new/invented fact) from
 * `Radios y descripciones.md` (the approved fact sheet), matched to real
 * product photography in `public/images/products/`.
 *
 * `specs` stays close to the original technical wording on purpose — specs
 * are supposed to read as precise. `summary` is the one field reworded for
 * a general business reader. `applications` is only ever filled in when the
 * source text explicitly names a use case — never inferred/invented.
 *
 * Two entries (DEM500, SL500e) have no real photo yet — `images: []` makes
 * ProductCard fall back to the elegant placeholder rather than a broken/
 * fabricated image. Add photos to `public/images/products/` and list them
 * here once available.
 */
export const PRODUCTS: Product[] = [
  {
    slug: "rva50",
    category: "Radios portátiles",
    name: "Motorola RVA50",
    summary:
      "Radio portátil de dos vías para uso empresarial, pensada para equipos que necesitan mantenerse comunicados con claridad durante toda la jornada.",
    type: "Portátil",
    band: "VHF / UHF",
    specs: [
      "Potencia de 2W con excelente cobertura",
      "6 códigos personalizables para una señal clara",
      "Diseño robusto y ergonómico, protección IP55",
      "Activación por voz avanzada (VOX)",
      "Identificación de canal con asignación de nombre",
      "Incluye cargador portátil",
    ],
    applications: [],
    images: ["/images/products/rva50-1.jpg", "/images/products/rva50-2.jpg", "/images/products/rva50-3.jpg"],
    isPlaceholder: false,
  },
  {
    slug: "dem300",
    category: "Radios móviles y estaciones base",
    name: "Motorola DEM300",
    summary:
      "Radio móvil MOTOTRBO de 45W pensada para el día a día del transporte: mantiene a conductores y despachadores conectados con una solución confiable y rentable, sin distracciones al volante.",
    type: "Móvil",
    band: "VHF 136–174 MHz (45W) / UHF 403–470 MHz (45W)",
    specs: [
      "45W de potencia en VHF y UHF",
      "Analógico/digital, actualizable a digital con un simple paquete de software",
      "Compatible con funciones MOTOTRBO avanzadas (interrupción de transmisión para priorizar comunicación esencial)",
      "Diseñado para un uso sencillo y sin distracciones al conducir",
      "Disponible también con pantalla alfanumérica",
    ],
    applications: ["Transporte de carga", "Transporte escolar", "Despacho de flotas"],
    images: ["/images/products/dem300-1.jpg"],
    isPlaceholder: false,
  },
  {
    slug: "dem500",
    category: "Radios móviles y estaciones base",
    name: "Motorola DEM500",
    summary:
      "Radio móvil digital compacta y eficiente, pensada para quienes recogen cargas o transportan pasajeros. Su audio inteligente se ajusta solo al ruido del entorno, sin distraer al conductor.",
    type: "Móvil",
    band: "VHF 136–174 MHz (25W) / UHF 403–470 MHz (25W)",
    specs: [
      "25W de potencia en VHF y UHF",
      "Función de audio inteligente: ajusta el volumen según el ruido de fondo",
      "El doble de capacidad de llamadas frente a la generación anterior",
      "Migración simple de analógico a digital, al ritmo y presupuesto de cada empresa",
      "Compatible con la función Transmit Interrupt para priorizar comunicaciones críticas",
    ],
    applications: [],
    images: [],
    isPlaceholder: false,
  },
  {
    slug: "r5-mototrbo",
    category: "Radios portátiles",
    name: "Motorola MOTOTRBO R5",
    summary:
      "Radio portátil con pantalla, pensada para entornos exigentes: audio fuerte y claro, controles intuitivos y una construcción lista para durar todo el turno, incluso usando guantes.",
    type: "Portátil con pantalla",
    band: "VHF / UHF",
    specs: [
      'Pantalla de 1.5" (132×48 px), configurable en 2 o 3 líneas',
      "Teclado fácil de usar incluso con guantes",
      "Audio alto programable de hasta 106 fonios, con supresión de ruido entrenada por IA",
      "Batería de hasta 32 horas de uso en una sola carga",
      "Certificación IP67 y estándar militar MIL-STD-810H",
      "Intrínsecamente seguro (UL TIA-4950)",
      "Botón dedicado de emergencia y botón PTT grande",
      "WiFi 2.4/5.0 GHz (WPA3), Bluetooth 5.2 y seguimiento de ubicación GNSS integrado",
    ],
    applications: [],
    images: [
      "/images/products/r5-1.jpg",
      "/images/products/r5-2.jpg",
      "/images/products/r5-3.jpg",
      "/images/products/r5-4.jpg",
    ],
    isPlaceholder: false,
  },
  {
    slug: "sl500e",
    category: "Radios portátiles",
    name: "Motorola SL500e",
    summary:
      "Radio portátil con pantalla LED irrompible que resalta con claridad la información importante, para una comunicación confiable y sencilla en el día a día.",
    type: "Portátil",
    band: "VHF 136–174 MHz (5W) / UHF1 403–470 MHz (4W) / UHF2 450–520 MHz (4W)",
    specs: [
      "Pantalla LED ActiveView irrompible con anuncios por voz MOTOTRBO",
      "Receptor de comunicaciones ultrasensible",
      "Conectividad microUSB para cargar y programar el radio de forma más eficiente",
      "Batería con duración probada de hasta 14.6 horas",
      "Certificación IP54, resistente al agua y al polvo",
    ],
    applications: [],
    images: [],
    isPlaceholder: false,
  },
  {
    slug: "tlk110-wave-ptx",
    category: "Radios portátiles",
    name: "Motorola TLK110 Wave PTX",
    summary:
      "Radio digital PTT que se comunica a través de redes celulares y WiFi en lugar de repetidoras propias, ideal para equipos que necesitan cobertura amplia sin invertir en infraestructura de radio.",
    type: "PTT digital (PoC)",
    band: "Redes celulares / WiFi 2.4 y 5 GHz",
    specs: [
      "PTT digital con llamadas por WiFi (2.4 y 5 GHz)",
      "VOX PTT inteligente",
      "Certificación IP67",
      "96 canales",
    ],
    applications: [],
    images: [
      "/images/products/tlk110-1.jpg",
      "/images/products/tlk110-2.jpg",
      "/images/products/tlk110-3.jpg",
      "/images/products/tlk110-4.jpg",
    ],
    isPlaceholder: false,
  },
  {
    slug: "r2",
    category: "Radios portátiles",
    name: "Motorola MOTOTRBO R2",
    summary:
      "Radio portátil de última generación que combina durabilidad y ergonomía para un manejo seguro y sencillo, con un audio configurable que mantiene la comunicación clara durante toda la operación.",
    type: "Portátil",
    band: "VHF 136–174 MHz (5W) / UHF1 403–470 MHz (4W) / UHF2 450–520 MHz (4W)",
    specs: [
      "64 canales",
      "Alcance superior y audio configurable",
      "Diseño duradero y ergonómico para un manejo seguro",
      "Integración sencilla con los sistemas de radio existentes",
    ],
    applications: [],
    images: ["/images/products/r2-1.jpg", "/images/products/r2-2.jpg", "/images/products/r2-3.jpg", "/images/products/r2-4.jpg"],
    isPlaceholder: false,
  },
  {
    slug: "magone-x10d",
    category: "Radios portátiles",
    name: "Motorola MagOne X10d",
    summary:
      "Radio portátil analógica y digital con tecnología DMR, preparada para entornos de trabajo exigentes y con la salida de audio más potente de toda la familia MagOne.",
    type: "Portátil analógico/digital",
    band: "UHF 400–470 / 470–527 MHz (4W) · VHF 136–155 / 152–174 MHz (5W)",
    specs: [
      "Tecnología DMR, compatible con DMRT2",
      "Certificación IP55",
      "Salida de audio de hasta 3W, la más potente de la familia MagOne",
      "Cancelación de ruido para un audio nítido incluso en entornos ruidosos",
      "Batería de hasta 23 horas de uso",
      "Cumple estándares militares (salitre, golpes, neblina)",
      "Primer radio de la familia con adaptador USB-C",
      "Grabación de voz de hasta 8 horas",
    ],
    applications: [],
    images: [
      "/images/products/magone-x10d-1.jpg",
      "/images/products/magone-x10d-2.jpg",
      "/images/products/magone-x10d-3.jpg",
      "/images/products/magone-x10d-4.jpg",
    ],
    isPlaceholder: false,
  },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Radios portátiles",
  "Radios móviles y estaciones base",
  "Repetidoras",
  "Accesorios originales",
];
