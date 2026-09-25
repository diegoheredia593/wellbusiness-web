/**
 * Bloques fijos del sitio de Wellbusiness.
 *
 * Transcritos literalmente de `apps/web/src/data/site.ts`/`coverage.ts`/
 * `about.ts` y del copy hardcodeado en cada página `.astro` (confirmado
 * archivo por archivo antes de escribir esto — nada inventado). Este
 * archivo es la "base de datos" local hasta que el sitio lea de D1
 * (Fase 4); estas mismas filas se insertan en la tabla `bloques`.
 *
 * Alcance deliberado — lo que SÍ se volvió bloque: SEO (título/descripción)
 * de cada página, el hero de cada página, los encabezados de sección
 * (`SectionHeading`) y CTAs (`CtaBanner`) de cada página, los párrafos de
 * marca/misión/visión/trayectoria, y los datos de contacto/marca globales.
 * Lo que NO se volvió bloque (se queda hardcodeado en los componentes,
 * decisión explícita para no inflar el alcance): las etiquetas de los
 * botones de WhatsApp, las pestañas de filtro del catálogo ("Todas"), los
 * mensajes de validación/éxito de los formularios, y cualquier micro-copy
 * de UI que no sea contenido de negocio.
 */
import { crearDeclarador, type EtiquetasSitio } from '@cms/core/bloques';

export const etiquetasSitio = {
  paginas: {
    global: 'Global',
    inicio: 'Inicio',
    nosotros: 'Nosotros',
    servicios: 'Servicios',
    sectores: 'Sectores',
    cobertura: 'Cobertura',
    catalogo: 'Catálogo',
    contacto: 'Contacto',
  },
  secciones: {
    'global.marca': 'Marca',
    'global.contacto': 'Datos de contacto',
    'inicio.meta': 'SEO',
    'inicio.hero': 'Hero',
    'inicio.trabajo': 'Cómo trabajamos',
    'inicio.marcas': 'Marcas y tecnología',
    'inicio.accesos': 'Acceso rápido a soluciones',
    'inicio.sectores': 'A quién ayudamos',
    'inicio.cobertura': 'Teaser de cobertura',
    'inicio.cta': 'CTA final',
    'nosotros.meta': 'SEO',
    'nosotros.hero': 'Hero',
    'nosotros.trabajo': 'Cómo trabajamos',
    'nosotros.motorola': 'Respaldo Motorola',
    'nosotros.idrocom': 'Relación con Idrocomsolutions',
    'nosotros.mision': 'Misión',
    'nosotros.vision': 'Visión',
    'nosotros.trayectoria': 'Trayectoria',
    'nosotros.valores': 'Valores',
    'nosotros.marcas': 'Marcas y tecnología',
    'nosotros.cta': 'CTA final',
    'servicios.meta': 'SEO',
    'servicios.hero': 'Hero',
    'servicios.cta': 'CTA final',
    'sectores.meta': 'SEO',
    'sectores.hero': 'Hero',
    'sectores.cta': 'CTA final',
    'cobertura.meta': 'SEO',
    'cobertura.hero': 'Hero',
    'cobertura.pocNota': 'Nota de comunicación PoC',
    'cobertura.disclaimer': 'Disclaimer legal de cobertura',
    'cobertura.formulario': 'Encabezado del formulario de evaluación',
    'catalogo.meta': 'SEO',
    'catalogo.hero': 'Hero',
    'catalogo.aviso': 'Aviso "sin precios"',
    'catalogo.asesoria': '¿No sabes qué radio elegir?',
    'catalogo.cta': 'CTA final',
    'contacto.meta': 'SEO',
    'contacto.hero': 'Hero',
  },
  /**
   * Nivel `sistema`: solo lo ve/edita un admin del portal. El disclaimer
   * legal de Motorola/marcas (rótulo de marca registrada) y las etiquetas de
   * accesibilidad no viven aquí como bloques — se quedaron en código
   * (`Icon.astro`, el pie de página) porque cambiarlas por accidente puede
   * tener implicaciones legales o de accesibilidad, y no aparecían ya como
   * texto plano editable en ninguna página.
   */
  sistema: [],
} satisfies EtiquetasSitio;

const { texto, largo } = crearDeclarador(etiquetasSitio);

export const bloques = [
  // ─── Marca y contacto (global) ────────────────────────────────────────
  texto('global.marca.nombre', 'Nombre de marca', 'Wellbusiness', { max: 40 }),
  texto('global.marca.empresaMadre', 'Empresa matriz', 'Idrocomsolutions', { max: 60 }),
  texto('global.marca.tagline', 'Frase legal/tagline', 'Soluciones de radiocomunicación para empresas en Ecuador.', {
    max: 120,
  }),
  largo(
    'global.marca.descripcionPorDefecto',
    'Descripción por defecto (SEO)',
    'Radios Motorola, alquiler, servicio técnico y soluciones de cobertura para empresas en Ecuador. Solicita asesoría para tu operación.',
    { max: 200 },
  ),
  texto('global.marca.dealerMotorola', 'Denominación de dealer Motorola', 'Dealer Autorizado Motorola en Ecuador', {
    max: 60,
    ayuda: 'Aparece en Inicio (tarjeta del logo) y en Nosotros (respaldo Motorola).',
  }),

  // Vacío = el sitio oculta ese canal (mismo comportamiento que hoy con `null`).
  texto('global.contacto.whatsapp', 'WhatsApp', '+593 98 161 5096', { max: 20, obligatorio: false }),
  texto('global.contacto.telefono', 'Teléfono', '+593 98 161 5096', { max: 20, obligatorio: false }),
  texto('global.contacto.correo', 'Correo', 'ventasidrocom@hotmail.com', { max: 80, obligatorio: false }),
  texto('global.contacto.direccion', 'Dirección', 'Calle Rumichaca 212 y Manuel Galecio', {
    max: 120,
    obligatorio: false,
  }),
  texto('global.contacto.horario', 'Horario de atención', '9:00 am – 6:00 pm', { max: 60, obligatorio: false }),
  texto('global.contacto.facebook', 'URL de Facebook', 'https://www.facebook.com/wellbusiness.gye/', {
    max: 200,
    obligatorio: false,
  }),

  // ─── Inicio ─────────────────────────────────────────────────────────────
  texto('inicio.meta.titulo', 'Título (SEO)', 'Wellbusiness', { max: 60 }),
  largo(
    'inicio.meta.descripcion',
    'Descripción (SEO)',
    'Radios Motorola, alquiler, servicio técnico y soluciones de cobertura para empresas en Ecuador. Solicita asesoría para tu operación.',
    { max: 200 },
  ),
  texto('inicio.hero.titulo', 'Título', 'Comunicación confiable para operaciones que no pueden detenerse.', {
    max: 120,
  }),
  largo(
    'inicio.hero.descripcion',
    'Descripción',
    'Radios Motorola, alquiler, soporte técnico e infraestructura de radiocomunicación para empresas en Ecuador. Te ayudamos a encontrar la solución adecuada para mantener a tu equipo coordinado.',
    { max: 300 },
  ),
  texto('inicio.hero.ctaPrincipal', 'Botón principal', 'Solicitar asesoría', { max: 30 }),
  texto('inicio.hero.ctaSecundaria', 'Botón secundario', 'Explorar catálogo Motorola', { max: 30 }),

  texto('inicio.trabajo.eyebrow', 'Etiqueta pequeña', 'Cómo trabajamos', { max: 30 }),
  texto(
    'inicio.trabajo.titulo',
    'Título',
    'Tu operación necesita estar conectada. Nosotros te ayudamos a lograrlo.',
    { max: 120 },
  ),
  largo(
    'inicio.trabajo.descripcion',
    'Descripción',
    'Cada operación tiene un terreno, un ritmo y una necesidad de comunicación distintos. En Wellbusiness te asesoramos para elegir equipos y servicios que respondan a tu entorno: desde la adquisición de radios hasta el alquiler, mantenimiento y soluciones de cobertura.',
    { max: 320 },
  ),

  texto('inicio.marcas.etiqueta', 'Etiqueta de la franja de logos', 'Tecnología y marcas con las que trabajamos', {
    max: 60,
  }),

  texto('inicio.accesos.titulo', 'Título', 'Acceso rápido a soluciones', { max: 60 }),

  texto('inicio.sectores.eyebrow', 'Etiqueta pequeña', 'A quién ayudamos', { max: 30 }),
  texto('inicio.sectores.titulo', 'Título', 'Soluciones pensadas para el trabajo en campo', { max: 100 }),
  largo(
    'inicio.sectores.descripcion',
    'Descripción',
    'Apoyamos a organizaciones que necesitan coordinación ágil entre equipos, instalaciones y personal operativo. Conversamos contigo para entender la operación y recomendar una alternativa adecuada.',
    { max: 300 },
  ),
  texto('inicio.sectores.ctaLabel', 'Texto del botón', 'Ver todos los sectores', { max: 30 }),

  texto('inicio.cobertura.eyebrow', 'Etiqueta pequeña', 'Cobertura', { max: 30 }),
  texto('inicio.cobertura.titulo', 'Título', 'Alternativas de cobertura en distintas zonas del país', { max: 100 }),
  largo(
    'inicio.cobertura.descripcion',
    'Descripción',
    'Consulta las zonas de servicio referenciales y las opciones de infraestructura disponibles. La cobertura efectiva depende de la ubicación, el terreno, los equipos y la configuración del sistema.',
    { max: 300 },
  ),
  texto('inicio.cobertura.ctaLabel', 'Texto del botón', 'Explorar cobertura', { max: 30 }),

  texto('inicio.cta.titulo', 'Título', 'Cuéntanos cómo trabaja tu equipo.', { max: 80 }),
  largo(
    'inicio.cta.descripcion',
    'Descripción',
    'Con esa información podemos orientarte sobre radios, alquiler, soporte o cobertura para tu operación.',
    { max: 200 },
  ),
  texto('inicio.cta.ctaLabel', 'Texto del botón', 'Hablar con un asesor', { max: 30 }),

  // ─── Nosotros ───────────────────────────────────────────────────────────
  texto('nosotros.meta.titulo', 'Título (SEO)', 'Nosotros', { max: 60 }),
  largo(
    'nosotros.meta.descripcion',
    'Descripción (SEO)',
    'Conoce Wellbusiness, sus soluciones de radiocomunicación para empresas y su relación con Idrocomsolutions.',
    { max: 200 },
  ),
  texto('nosotros.hero.eyebrow', 'Etiqueta pequeña', 'Nosotros', { max: 30 }),
  texto('nosotros.hero.titulo', 'Título', 'Wellbusiness, soluciones de radiocomunicación para empresas', {
    max: 100,
  }),
  largo(
    'nosotros.hero.descripcion',
    'Descripción',
    'Wellbusiness forma parte de Idrocomsolutions y ofrece productos y servicios de radiocomunicación para empresas en Ecuador. Acompañamos a nuestros clientes en la selección de equipos, el soporte y la evaluación de alternativas para sus operaciones.',
    { max: 320 },
  ),

  texto(
    'nosotros.trabajo.titulo',
    'Título',
    'Primero entendemos tu operación. Luego exploramos la solución.',
    { max: 100 },
  ),
  largo(
    'nosotros.trabajo.descripcion',
    'Descripción',
    'Escuchamos qué necesita comunicar tu equipo, dónde trabaja y qué retos enfrenta. Con esa información podemos orientarte sobre equipos, alquiler, servicio técnico o infraestructura.',
    { max: 280 },
  ),

  largo(
    'nosotros.motorola.parrafo',
    'Párrafo',
    'Equipos y accesorios Motorola para uso profesional. Wellbusiness es Dealer Autorizado Motorola en Ecuador.',
    {
      max: 200,
      ayuda: 'Si cambia la denominación de dealer (global.marca.dealerMotorola), actualiza también esta frase a mano.',
    },
  ),

  largo(
    'nosotros.idrocom.parrafo',
    'Párrafo',
    'Wellbusiness es la marca comercial de radiocomunicación de Idrocomsolutions.',
    { max: 200 },
  ),

  largo(
    'nosotros.mision.texto',
    'Misión',
    'Somos una empresa comercializadora y desarrolladora de servicios de comunicación, localización y gestión. Entregamos soluciones integrales y rentables a las necesidades de nuestros clientes, generando valor agregado a través de la excelencia en la atención y el servicio técnico, y logrando la satisfacción de nuestros clientes internos y externos.',
    { max: 500 },
  ),
  largo(
    'nosotros.vision.texto',
    'Visión',
    'Ser la empresa aliada más confiable en servicios y productos de Tecnologías de la Información y Comunicación, diferenciándonos por el servicio, la calidad y la innovación que satisfacen las expectativas de nuestros clientes, con el respaldo de un equipo humano capacitado y comprometido.',
    { max: 500 },
  ),
  largo(
    'nosotros.trayectoria.texto',
    'Trayectoria (también se muestra en Cobertura)',
    'Más de 18 años de trayectoria operando sistemas de radiocomunicación profesional en las bandas UHF1, UHF2 y VHF, además de comunicación PoC vía redes GPRS, GSM, 3G y 4G.',
    { max: 300 },
  ),

  texto('nosotros.valores.titulo', 'Título de la sección', 'Nuestros valores', { max: 60 }),
  texto('nosotros.marcas.etiqueta', 'Etiqueta de la franja de logos', 'Marcas que han confiado en nosotros', {
    max: 60,
  }),

  texto('nosotros.cta.titulo', 'Título', '¿Quieres conocer más sobre Wellbusiness?', { max: 80 }),
  texto('nosotros.cta.ctaLabel', 'Texto del botón', 'Solicitar asesoría', { max: 30 }),

  // ─── Servicios ──────────────────────────────────────────────────────────
  texto('servicios.meta.titulo', 'Título (SEO)', 'Servicios', { max: 60 }),
  largo(
    'servicios.meta.descripcion',
    'Descripción (SEO)',
    'Venta, alquiler, mantenimiento, reparación, infraestructura y estudios de ingeniería para sistemas de radiocomunicación.',
    { max: 200 },
  ),
  texto('servicios.hero.eyebrow', 'Etiqueta pequeña', 'Servicios', { max: 30 }),
  texto('servicios.hero.titulo', 'Título', 'Todo lo que tu sistema de radiocomunicación necesita', { max: 100 }),
  largo(
    'servicios.hero.descripcion',
    'Descripción',
    'Desde equipos y accesorios hasta soporte, alquiler e infraestructura. Cuéntanos el alcance de tu operación y te ayudaremos a identificar el servicio adecuado.',
    { max: 300 },
  ),
  texto('servicios.cta.titulo', 'Título', '¿Tienes un requerimiento específico?', { max: 80 }),
  largo(
    'servicios.cta.descripcion',
    'Descripción',
    'Cuéntanos qué necesitas resolver y te pondremos en contacto con el área correspondiente.',
    { max: 200 },
  ),
  texto('servicios.cta.ctaLabel', 'Texto del botón', 'Contactar a Wellbusiness', { max: 30 }),

  // ─── Sectores ───────────────────────────────────────────────────────────
  texto('sectores.meta.titulo', 'Título (SEO)', 'Sectores', { max: 60 }),
  largo(
    'sectores.meta.descripcion',
    'Descripción (SEO)',
    'Conoce los sectores atendidos por Wellbusiness: seguridad, transporte, industria, agricultura e instituciones públicas.',
    { max: 200 },
  ),
  texto('sectores.hero.eyebrow', 'Etiqueta pequeña', 'Sectores', { max: 30 }),
  texto('sectores.hero.titulo', 'Título', 'Comunicación para equipos que trabajan en movimiento', { max: 100 }),
  largo(
    'sectores.hero.descripcion',
    'Descripción',
    'Cada sector tiene condiciones y retos distintos. En Wellbusiness escuchamos cómo opera tu equipo para orientarte hacia una solución de radiocomunicación apropiada.',
    { max: 300 },
  ),
  texto('sectores.cta.titulo', 'Título', 'Cuéntanos sobre tu operación.', { max: 80 }),
  texto('sectores.cta.ctaLabel', 'Texto del botón', 'Solicitar asesoría', { max: 30 }),

  // ─── Cobertura ──────────────────────────────────────────────────────────
  texto('cobertura.meta.titulo', 'Título (SEO)', 'Cobertura', { max: 60 }),
  largo(
    'cobertura.meta.descripcion',
    'Descripción (SEO)',
    'Consulta las zonas y alternativas de cobertura de Wellbusiness. Solicita una evaluación para tu operación o ruta.',
    { max: 200 },
  ),
  texto('cobertura.hero.eyebrow', 'Etiqueta pequeña', 'Cobertura', { max: 30 }),
  texto('cobertura.hero.titulo', 'Título', 'Conoce las alternativas de cobertura para tu operación', { max: 100 }),
  largo(
    'cobertura.hero.descripcion',
    'Descripción',
    'Consulta las zonas de servicio y las opciones de infraestructura disponibles. La cobertura efectiva depende de la ubicación, el terreno, los equipos y la configuración del sistema.',
    { max: 300 },
  ),
  largo(
    'cobertura.pocNota.texto',
    'Texto',
    'Además de radio UHF/VHF, contamos con comunicación PoC (Push-to-Talk over Cellular) vía redes GPRS, GSM, 3G y 4G. Consulta si esta alternativa está disponible para tu zona y si es adecuada para tu operación, considerando la cobertura de datos móviles de tu operador.',
    { max: 400 },
  ),
  largo(
    'cobertura.disclaimer.texto',
    'Texto',
    'La cobertura y los porcentajes indicados provienen del material de referencia de Wellbusiness y son referenciales; no constituyen una garantía de señal en cada punto. El alcance real depende de la ubicación, la topografía, las edificaciones, las antenas, los equipos y la configuración del sistema. Solicita una evaluación para confirmar la cobertura específica de tu operación.',
    { max: 500 },
  ),
  texto('cobertura.formulario.titulo', 'Título', '¿Dónde necesitas comunicar a tu equipo?', { max: 80 }),
  largo(
    'cobertura.formulario.descripcion',
    'Descripción',
    'Comparte la ciudad, zona o ruta de operación. El equipo de Wellbusiness podrá revisar tu requerimiento y orientarte sobre los siguientes pasos.',
    { max: 220 },
  ),

  // ─── Catálogo ───────────────────────────────────────────────────────────
  texto('catalogo.meta.titulo', 'Título (SEO)', 'Catálogo Motorola', { max: 60 }),
  largo(
    'catalogo.meta.descripcion',
    'Descripción (SEO)',
    'Consulta radios, repetidoras y accesorios Motorola para uso profesional. Revisa especificaciones y solicita una cotización.',
    { max: 200 },
  ),
  texto('catalogo.hero.eyebrow', 'Etiqueta pequeña', 'Catálogo informativo', { max: 30 }),
  texto('catalogo.hero.titulo', 'Título', 'Equipos Motorola para comunicación profesional', { max: 100 }),
  largo(
    'catalogo.hero.descripcion',
    'Descripción',
    'Conoce las opciones de radiocomunicación y accesorios Motorola disponibles para empresas. Elige un modelo para ver sus fotos, especificaciones completas y consultarnos si se adapta a tu operación.',
    { max: 320 },
  ),
  texto(
    'catalogo.aviso.texto',
    'Texto',
    'Catálogo informativo. Sin precios, sin carrito. Disponibilidad y configuración sujetas a consulta.',
    { max: 160 },
  ),
  texto('catalogo.asesoria.titulo', 'Título', '¿No sabes qué radio elegir?', { max: 60 }),
  largo(
    'catalogo.asesoria.descripcion',
    'Descripción',
    'La cobertura requerida, el entorno, el número de usuarios y la infraestructura disponible influyen en la elección. Cuéntanos sobre tu operación y te orientaremos.',
    { max: 260 },
  ),
  texto('catalogo.asesoria.ctaLabel', 'Texto del botón', 'Solicitar recomendación', { max: 30 }),
  texto('catalogo.cta.titulo', 'Título', '¿Buscas un modelo específico?', { max: 60 }),
  largo(
    'catalogo.cta.descripcion',
    'Descripción',
    'Escríbenos y confirmamos disponibilidad, especificaciones y compatibilidad con tu sistema actual.',
    { max: 200 },
  ),
  texto('catalogo.cta.ctaLabel', 'Texto del botón', 'Hablar con un asesor', { max: 30 }),

  // ─── Contacto ───────────────────────────────────────────────────────────
  texto('contacto.meta.titulo', 'Título (SEO)', 'Contacto', { max: 60 }),
  largo(
    'contacto.meta.descripcion',
    'Descripción (SEO)',
    'Consulta radios Motorola, alquiler, soporte técnico, cobertura e infraestructura para tu empresa.',
    { max: 200 },
  ),
  texto('contacto.hero.eyebrow', 'Etiqueta pequeña', 'Contacto', { max: 30 }),
  texto('contacto.hero.titulo', 'Título', 'Hablemos de lo que tu operación necesita', { max: 100 }),
  largo(
    'contacto.hero.descripcion',
    'Descripción',
    'Déjanos tus datos y cuéntanos si buscas radios, alquiler, servicio técnico, cobertura o asesoría de ingeniería. El equipo de Wellbusiness se pondrá en contacto contigo.',
    { max: 300 },
  ),
];
