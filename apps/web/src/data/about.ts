import type { IconName } from "./types";

/**
 * Misión, visión y valores de Wellbusiness/Idrocomsolutions, transcritos de
 * "Sobre nosotros.md" (el copy de la página anterior de la empresa,
 * proporcionado directamente por Wellbusiness) y corregidos en ortografía y
 * redacción sin cambiar su sentido. La visión original mencionaba una meta
 * puntual "en el 2021" — ya vencida — por lo que se reformuló como una
 * declaración atemporal; actualízala si la empresa define una nueva meta con
 * fecha. Edita este archivo si Wellbusiness revisa este contenido; no se
 * debe inventar ni hardcodear texto nuevo en las páginas.
 */

export const MISSION =
  "Somos una empresa comercializadora y desarrolladora de servicios de comunicación, localización y gestión. Entregamos soluciones integrales y rentables a las necesidades de nuestros clientes, generando valor agregado a través de la excelencia en la atención y el servicio técnico, y logrando la satisfacción de nuestros clientes internos y externos.";

export const VISION =
  "Ser la empresa aliada más confiable en servicios y productos de Tecnologías de la Información y Comunicación, diferenciándonos por el servicio, la calidad y la innovación que satisfacen las expectativas de nuestros clientes, con el respaldo de un equipo humano capacitado y comprometido.";

export interface CompanyValue {
  title: string;
  description: string;
  icon: IconName;
}

export const COMPANY_VALUES: CompanyValue[] = [
  {
    title: "Respeto",
    description:
      "Todas nuestras relaciones internas y externas se desarrollan con cuidado, sin vulnerar los derechos de los demás.",
    icon: "shield",
  },
  {
    title: "Responsabilidad",
    description:
      "Cumplimos cada uno de nuestros compromisos con nuestros clientes, nuestro equipo, la comunidad y el medio ambiente.",
    icon: "check",
  },
  {
    title: "Seriedad",
    description:
      "Acompañamos y asesoramos a nuestros clientes en todo momento, anticipándonos a sus necesidades con propuestas innovadoras orientadas a la mejora continua.",
    icon: "compass",
  },
  {
    title: "Confidencialidad",
    description:
      "Protegemos la información, la seguridad y los datos confidenciales de nuestros clientes y colaboradores en cada uno de nuestros procesos.",
    icon: "building",
  },
];

/**
 * Trayectoria de la empresa, mencionada en el material de referencia
 * ("18 años en comunicaciones"). Suavizada a "más de 18 años" para que se
 * mantenga vigente sin necesidad de actualizar un número exacto cada año.
 */
export const COMPANY_TRAJECTORY =
  "Más de 18 años de trayectoria operando sistemas de radiocomunicación profesional en las bandas UHF1, UHF2 y VHF, además de comunicación PoC vía redes GPRS, GSM, 3G y 4G.";
