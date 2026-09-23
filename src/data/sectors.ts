import type { SectorItem } from "./types";

/**
 * Transcribed from COPY-WELLBUSINESS.md → "Sectores". The brief marks these
 * as "sujeto a confirmación" — only sectors Wellbusiness can confirm as
 * actually served should remain in this array before publishing.
 */
export const SECTORS: SectorItem[] = [
  {
    slug: "seguridad-privada",
    title: "Seguridad privada",
    description:
      "Facilita la coordinación entre personal, supervisores y centros de operación. Consulta radios, accesorios, cobertura y alternativas de alquiler para las características de tu servicio.",
    icon: "shield",
  },
  {
    slug: "transporte-logistica",
    title: "Transporte y logística",
    description:
      "Mantén coordinadas las comunicaciones entre conductores, despachadores y personal operativo. Cuéntanos tus rutas y puntos de trabajo para revisar las alternativas disponibles.",
    icon: "truck",
  },
  {
    slug: "operaciones-industriales",
    title: "Operaciones industriales y de campo",
    description:
      "Consulta equipos y sistemas para personal distribuido en instalaciones, plantas o zonas de trabajo. La recomendación dependerá del entorno y de la cobertura requerida.",
    icon: "factory",
  },
  {
    slug: "agricultura-camaroneras",
    title: "Agricultura y camaroneras",
    description:
      "Revisa alternativas para coordinar personal y equipos en operaciones extensas o distribuidas. Podemos conversar sobre radios, cobertura e infraestructura según la ubicación.",
    icon: "leaf",
  },
  {
    slug: "instituciones-publicas",
    title: "Instituciones y servicios públicos",
    description:
      "Consulta opciones de radiocomunicación para equipos que requieren coordinación operativa. La solución se define de acuerdo con el alcance, el entorno y las especificaciones del proyecto.",
    icon: "building",
  },
];
