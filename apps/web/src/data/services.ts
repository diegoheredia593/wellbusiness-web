import type { ServiceItem } from "./types";

/** Transcribed from COPY-WELLBUSINESS.md → "Servicios". */
export const SERVICES: ServiceItem[] = [
  {
    slug: "venta-radios",
    title: "Venta de radios y accesorios",
    hook: "Equipos profesionales para mantener a tu equipo conectado.",
    description:
      "Consulta radios Motorola y accesorios originales para distintos tipos de operación. Te asesoramos según el entorno de uso, la cantidad de usuarios y la cobertura que necesitas.",
    ctaLabel: "Consultar equipos",
    motive: "Catálogo Motorola",
    icon: "radio-handheld",
  },
  {
    slug: "alquiler-radios",
    title: "Alquiler de radios y frecuencias",
    hook: "Una alternativa flexible para proyectos y operaciones temporales.",
    description:
      "Consulta la disponibilidad de radios y alternativas de frecuencia para tu operación. El alcance, las condiciones y la compatibilidad se revisan según la ubicación y el requerimiento.",
    ctaLabel: "Consultar alquiler",
    motive: "Alquiler",
    icon: "radio-mobile",
  },
  {
    slug: "mantenimiento",
    title: "Mantenimiento y reparación",
    hook: "Atención técnica para tus equipos de radiocomunicación.",
    description:
      "Solicita una revisión para identificar el estado del equipo y las opciones de mantenimiento o reparación. Comparte el modelo, la cantidad de equipos y una descripción de la falla para iniciar la consulta.",
    ctaLabel: "Solicitar revisión técnica",
    motive: "Mantenimiento o reparación",
    icon: "wrench",
  },
  {
    slug: "sitios-repeticion",
    title: "Alquiler de sitios de repetición",
    hook: "Infraestructura para ampliar las posibilidades de comunicación.",
    description:
      "Consulta sitios de repetición disponibles y su posible aplicación a tu sistema. La ubicación y viabilidad deben evaluarse para cada proyecto.",
    ctaLabel: "Consultar sitios disponibles",
    motive: "Infraestructura",
    icon: "tower",
  },
  {
    slug: "espacio-fisico",
    title: "Alquiler de espacio físico",
    hook: "Espacio para instalaciones de telecomunicaciones.",
    description:
      "Consulta opciones de espacio físico para instalar infraestructura de telecomunicaciones. Comparte la ubicación y los requerimientos técnicos para revisar disponibilidad y factibilidad.",
    ctaLabel: "Consultar disponibilidad",
    motive: "Infraestructura",
    icon: "building",
  },
  {
    slug: "estudios-ingenieria",
    title: "Estudios de ingeniería",
    hook: "Planificación técnica para una solución adecuada a tu zona.",
    description:
      "Consulta estudios de ingeniería y asesoría para sistemas de radiocomunicación. El alcance se define según el proyecto, las necesidades de cobertura y los requisitos técnicos aplicables.",
    ctaLabel: "Conversar sobre mi proyecto",
    motive: "Estudios de ingeniería",
    icon: "compass",
  },
];
