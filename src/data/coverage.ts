import type { CoverageZone } from "./types";

/**
 * Transcribed verbatim from COPY-WELLBUSINESS.md → "Cobertura → Zonas de
 * cobertura". The brief is explicit that this content "debe ser verificada y
 * actualizada por el equipo técnico antes de publicarse" — every entry here
 * carries `pendingValidation: true` for that reason, and the page renders a
 * visible notice instead of implying these are guaranteed coverage areas.
 * No percentages/efficacy figures from the old site are included anywhere.
 */
export const COVERAGE_ZONES: CoverageZone[] = [
  {
    slug: "costa-sur-occidente",
    title: "Cobertura 1 · Costa sur y occidente",
    description:
      "El material anterior describe presencia en sectores de Los Ríos, El Oro, Guayas, Santa Elena, Bolívar y Manabí. Una alternativa para empresas con operaciones interprovinciales que necesitan coordinar equipos en distintas zonas.",
    interestNote:
      "Sectores de interés mencionados: seguridad, transporte, minería, agricultura, camaroneras e instituciones públicas.",
    pendingValidation: true,
  },
  {
    slug: "guayaquil-alrededores",
    title: "Cobertura 2 · Guayaquil y alrededores",
    description:
      "El material anterior describe cobertura en el área metropolitana de Guayaquil y zonas aledañas. El alcance indicado allí requiere validación técnica antes de publicarse.",
    interestNote:
      "Puede ser de interés para operaciones portuarias, transporte y organizaciones públicas o privadas que necesiten comunicación coordinada.",
    pendingValidation: true,
  },
  {
    slug: "costa-guayas-el-oro",
    title: "Cobertura 3 · Costa de Guayas y El Oro",
    description:
      "El material anterior incluye zonas costeras de Guayas y El Oro, así como el golfo de Guayaquil. Puede ser relevante para operaciones camaroneras, transporte interprovincial y servicios públicos, sujeto a verificación del sitio y la operación.",
    pendingValidation: true,
  },
  {
    slug: "suroccidente",
    title: "Cobertura 4 · Suroccidente",
    description:
      "El material anterior describe cobertura mixta en zonas de Guayas, El Oro y Santa Elena. Solicita una evaluación para confirmar las localidades y condiciones específicas de servicio.",
    pendingValidation: true,
  },
  {
    slug: "multisitio",
    title: "Cobertura ampliada · Sistemas multisitio",
    description:
      "Para operaciones que requieren comunicar distintas áreas, se puede evaluar la integración de sitios de repetición en una configuración multisitio. La viabilidad y el alcance dependen del proyecto y deben confirmarse con el equipo técnico.",
    pendingValidation: true,
  },
];

export const COVERAGE_POC_NOTE =
  "El material anterior también menciona comunicación PoC sobre redes celulares. Consulta si esta alternativa está disponible para tu zona y si es adecuada para tu operación, considerando la cobertura de datos móviles.";

export const COVERAGE_DISCLAIMER =
  "La cobertura indicada es referencial y no constituye una garantía de señal en cada punto. La evaluación debe considerar ubicación, topografía, edificaciones, antenas, equipos y configuración. Los porcentajes geográficos y de eficacia se añadirán solo después de validar su alcance, periodo y metodología.";
