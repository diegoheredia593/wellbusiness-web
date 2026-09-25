import type { CoverageZone } from "./types";

/**
 * Transcribed from "Sobre nosotros.md" → "Área de operaciones" (the
 * company's previous website copy, supplied directly by Wellbusiness),
 * corrected for spelling and rewritten for clarity — the underlying claims
 * (zones, percentages, efficacy figures) are unchanged, not re-verified.
 * Every entry still carries `pendingValidation: true` because those figures
 * come from the prior site's own copy, not a fresh technical validation —
 * the page keeps rendering the "Referencial" badge and disclaimer for that
 * reason. Update this file (not the page) if Wellbusiness revises or
 * confirms new figures.
 */
export const COVERAGE_ZONES: CoverageZone[] = [
  {
    slug: "costa-sur-occidente",
    title: "Cobertura 1 · Costa sur y occidente",
    description:
      "Cobertura en UHF y VHF sobre el área costanera del sur y occidente del país, con presencia aproximada en Los Ríos (80%), El Oro (85%), Guayas (90%), Santa Elena (90%), Bolívar (50%) y Manabí (45%). Opera los 365 días del año, con una eficacia de operación anual cercana al 97%.",
    interestNote:
      "Una de las mejores alternativas para clientes con operaciones interprovinciales: seguridad, transporte, minería, agricultura, camaroneras y entidades públicas (GAD municipales y organismos de tránsito).",
    pendingValidation: true,
  },
  {
    slug: "guayaquil-alrededores",
    title: "Cobertura 2 · Guayaquil y alrededores",
    description:
      "Cobertura en UHF y VHF sobre el área metropolitana de Guayaquil, con un alcance aproximado del 99% dentro de la ciudad y de 40 a 60 km a su alrededor. Eficacia de operación anual cercana al 99.67%.",
    interestNote:
      "Una alternativa robusta para empresas portuarias, transporte privado y público, y organizaciones públicas o privadas que necesiten comunicación rápida y coordinada.",
    pendingValidation: true,
  },
  {
    slug: "costa-guayas-el-oro",
    title: "Cobertura 3 · Costa de Guayas y El Oro",
    description:
      "Cobertura en UHF y VHF sobre el área costanera de Guayas y El Oro, incluyendo el golfo de Guayaquil, con una eficacia de operación anual cercana al 99.30%.",
    interestNote:
      "Puede ser relevante para camaroneras, transporte interprovincial y entidades públicas que requieran movilidad efectiva en el sitio de operación.",
    pendingValidation: true,
  },
  {
    slug: "suroccidente",
    title: "Cobertura 4 · Suroccidente",
    description:
      "Cobertura mixta sobre el área suroccidental del país, con un alcance aproximado del 90% en Guayas, El Oro y Santa Elena, y una eficacia de operación anual cercana al 97%.",
    interestNote:
      "Una alternativa para empresas portuarias, transporte privado y público, y organizaciones públicas o privadas que requieran comunicación eficaz y coordinada.",
    pendingValidation: true,
  },
  {
    slug: "multisitio",
    title: "Cobertura ampliada · Sistemas multisitio",
    description:
      "Integración de sitios de repetición en una configuración multisitio en tiempo real, dentro de las zonas indicadas o a nivel nacional según el requerimiento del cliente, con un tráfico efectivo anual cercano al 98%.",
    interestNote: "La viabilidad y el alcance exactos dependen del proyecto y deben confirmarse con el equipo técnico.",
    pendingValidation: true,
  },
];

export const COVERAGE_POC_NOTE =
  "Además de radio UHF/VHF, contamos con comunicación PoC (Push-to-Talk over Cellular) vía redes GPRS, GSM, 3G y 4G. Consulta si esta alternativa está disponible para tu zona y si es adecuada para tu operación, considerando la cobertura de datos móviles de tu operador.";

export const COVERAGE_DISCLAIMER =
  "La cobertura y los porcentajes indicados provienen del material de referencia de Wellbusiness y son referenciales; no constituyen una garantía de señal en cada punto. El alcance real depende de la ubicación, la topografía, las edificaciones, las antenas, los equipos y la configuración del sistema. Solicita una evaluación para confirmar la cobertura específica de tu operación.";
