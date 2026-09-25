/**
 * Contenido inicial de Wellbusiness — transcrito literalmente de
 * `apps/web/src/data/{products,services,sectors,coverage,faq,logos,about}.ts`
 * y de las 4 tarjetas de "Acceso rápido a soluciones" hardcodeadas en
 * `apps/web/src/pages/index.astro`. Cero contenido inventado: cada campo
 * viene de un archivo fuente real, confirmado línea por línea antes de
 * transcribirlo aquí.
 *
 * Las fotos (productos y marcas) viven en la biblioteca de medios del
 * portal, no como archivos estáticos de `apps/web` — el portal vive en
 * otro dominio y una ruta relativa como `/images/...` no resuelve ahí
 * (verificado en local: redirige a `/entrar`). `scripts/importar-fotos.ts`
 * las sube una sola vez y `./medios.ts`/`./medios-generados.ts` guardan el
 * id/ancho/alto/alt real de cada una.
 */
import { medio } from './medios';

const CREADO = '2026-09-25T00:00:00.000Z';

/** Completa los campos base de un ítem publicado. */
function item<T extends object>(id: string, orden: number, campos: T) {
  return { id, estado: 'publicado' as const, orden, creado: CREADO, actualizado: CREADO, ...campos };
}

// ─── Catálogo ──────────────────────────────────────────────────────────

export const categorias = [
  item('cat-radios-portatiles', 1, {
    nombre: 'Radios portátiles',
    slug: 'radios-portatiles',
    descripcion: null,
  }),
  item('cat-radios-moviles', 2, {
    nombre: 'Radios móviles y estaciones base',
    slug: 'radios-moviles',
    descripcion: null,
  }),
  item('cat-repetidoras', 3, {
    nombre: 'Repetidoras',
    slug: 'repetidoras',
    descripcion: null,
  }),
  item('cat-accesorios-originales', 4, {
    nombre: 'Accesorios originales',
    slug: 'accesorios-originales',
    descripcion: null,
  }),
];

export const productos = [
  item('prod-rva50', 1, {
    nombre: 'Motorola RVA50',
    slug: 'rva50',
    categoria: 'radios-portatiles',
    resumen:
      'Radio empresarial fortalecido y sencillo de usar, pensado para construcción, mantenimiento y administración de edificios. Perilla de canal simple, audio fuerte y listo para usar desde el primer día.',
    tipo: 'Portátil',
    banda: 'VHF 150–161,05 MHz / UHF 450–470 MHz',
    specs: [
      'Cobertura de hasta 23.225 m² o 20 pisos con la versión de 2 W',
      'Perilla selectora de canal (8 canales) y anuncio de canal personalizado, fácil de manejar',
      'Potencia de hasta 2W con 122 códigos de privacidad para una señal clara',
      'Manos libres con VOX avanzado (accesorios opcionales)',
      'Resistente: IP54/55 y estándares militares MIL-STD 810 C, D, E, F y G',
      'Protección antimicrobiana en la superficie del radio',
      'Probado con la Prueba Acelerada de Vida de Motorola, que simula hasta 5 años de uso en campo',
      'Listo para usar: incluye radio, batería de ion de litio de 2100 mAh, funda con clip giratorio, bandeja de carga y guía de usuario',
    ],
    aplicaciones: ['Construcción', 'Mantenimiento de edificios', 'Administración de edificios'],
    fotos: [
      medio('products/rva50-1.jpg'),
      medio('products/rva50-2.jpg'),
      medio('products/rva50-3.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-dem300', 2, {
    nombre: 'Motorola DEM300',
    slug: 'dem300',
    categoria: 'radios-moviles',
    resumen:
      'Radio móvil MOTOTRBO de 45W pensada para el día a día del transporte: mantiene a conductores y despachadores conectados con una solución confiable y rentable, sin distracciones al volante.',
    tipo: 'Móvil',
    banda: 'VHF 136–174 MHz (45W) / UHF 403–470 MHz (45W)',
    specs: [
      '45W de potencia en VHF y UHF',
      'Analógico/digital, actualizable a digital con un simple paquete de software',
      'Compatible con funciones MOTOTRBO avanzadas (interrupción de transmisión para priorizar comunicación esencial)',
      'Diseñado para un uso sencillo y sin distracciones al conducir',
      'Disponible también con pantalla alfanumérica',
    ],
    aplicaciones: ['Transporte de carga', 'Transporte escolar', 'Despacho de flotas'],
    fotos: [medio('products/dem300-1.jpg')],
    esPlaceholder: 'no',
  }),
  item('prod-dem500', 3, {
    nombre: 'Motorola DEM500',
    slug: 'dem500',
    categoria: 'radios-moviles',
    resumen:
      'Radio móvil digital compacta y eficiente, pensada para quienes recogen cargas o transportan pasajeros. Su audio inteligente se ajusta solo al ruido del entorno, sin distraer al conductor.',
    tipo: 'Móvil',
    banda: 'VHF 136–174 MHz (25W) / UHF 403–470 MHz (25W)',
    specs: [
      '25W de potencia en VHF y UHF',
      'Función de audio inteligente: ajusta el volumen según el ruido de fondo',
      'El doble de capacidad de llamadas frente a la generación anterior',
      'Migración simple de analógico a digital, al ritmo y presupuesto de cada empresa',
      'Compatible con la función Transmit Interrupt para priorizar comunicaciones críticas',
    ],
    aplicaciones: [],
    fotos: [medio('products/dem500-1.jpg')],
    esPlaceholder: 'no',
  }),
  item('prod-r5-mototrbo', 4, {
    nombre: 'Motorola MOTOTRBO R5',
    slug: 'r5-mototrbo',
    categoria: 'radios-portatiles',
    resumen:
      'Radio portátil con pantalla, pensada para entornos exigentes: audio fuerte y claro, controles intuitivos y una construcción lista para durar todo el turno, incluso usando guantes.',
    tipo: 'Portátil con pantalla',
    banda: 'VHF / UHF',
    specs: [
      'Pantalla de 1.5" (132×48 px), configurable en 2 o 3 líneas',
      'Teclado fácil de usar incluso con guantes',
      'Audio alto programable de hasta 106 fonios, con supresión de ruido entrenada por IA',
      'Batería de hasta 32 horas de uso en una sola carga',
      'Certificación IP67 y estándar militar MIL-STD-810H',
      'Intrínsecamente seguro (UL TIA-4950)',
      'Botón dedicado de emergencia y botón PTT grande',
      'WiFi 2.4/5.0 GHz (WPA3), Bluetooth 5.2 y seguimiento de ubicación GNSS integrado',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/r5-1.jpg'),
      medio('products/r5-2.jpg'),
      medio('products/r5-3.jpg'),
      medio('products/r5-4.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-sl500e', 5, {
    nombre: 'Motorola SL500e',
    slug: 'sl500e',
    categoria: 'radios-portatiles',
    resumen:
      'Radio portátil con pantalla LED irrompible que resalta con claridad la información importante, para una comunicación confiable y sencilla en el día a día.',
    tipo: 'Portátil',
    banda: 'VHF 136–174 MHz (5W) / UHF1 403–470 MHz (4W) / UHF2 450–520 MHz (4W)',
    specs: [
      'Pantalla LED ActiveView irrompible con anuncios por voz MOTOTRBO',
      'Receptor de comunicaciones ultrasensible',
      'Conectividad microUSB para cargar y programar el radio de forma más eficiente',
      'Batería con duración probada de hasta 14.6 horas',
      'Certificación IP54, resistente al agua y al polvo',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/sl500e-1.jpg'),
      medio('products/sl500e-2.jpg'),
      medio('products/sl500e-3.jpg'),
      medio('products/sl500e-4.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-tlk110-wave-ptx', 6, {
    nombre: 'Motorola TLK110 Wave PTX',
    slug: 'tlk110-wave-ptx',
    categoria: 'radios-portatiles',
    resumen:
      'Radio digital PTT que se comunica a través de redes celulares y WiFi en lugar de repetidoras propias, ideal para equipos que necesitan cobertura amplia sin invertir en infraestructura de radio.',
    tipo: 'PTT digital (PoC)',
    banda: 'Redes celulares / WiFi 2.4 y 5 GHz',
    specs: [
      'PTT digital con llamadas por WiFi (2.4 y 5 GHz)',
      'VOX PTT inteligente',
      'Certificación IP67',
      '96 canales',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/tlk110-1.jpg'),
      medio('products/tlk110-2.jpg'),
      medio('products/tlk110-3.jpg'),
      medio('products/tlk110-4.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-r2', 7, {
    nombre: 'Motorola MOTOTRBO R2',
    slug: 'r2',
    categoria: 'radios-portatiles',
    resumen:
      'El compañero de todos los días: un radio resistente y potente que combina durabilidad y ergonomía para un manejo seguro, con batería para toda la jornada y audio configurable que se escucha claro incluso en los entornos más ruidosos.',
    tipo: 'Portátil',
    banda: 'VHF 136–174 MHz (5W) / 350 350–400 MHz (4W) / UHF1 400–480 MHz (4W) / UHF2 450–527 MHz (4W)',
    specs: [
      '64 canales y hasta 26,5 horas de autonomía en modo digital (batería de alta capacidad)',
      'Modo directo de rango extendido: llega más lejos sin infraestructura adicional',
      'Audio de hasta 101 fonios, con supresión de ruido SINC+ y supresión de retroalimentación acústica',
      'Resistente al trabajo duro: IP55 (agua y polvo) y resistencia MIL-STD 810',
      'Funciones de seguridad: trabajador solitario, emergencia digital, monitor remoto y privacidad mejorada',
      'Activación/desactivación remota del radio en caso de pérdida o robo',
      'Transición sin riesgo: funciona en modo analógico y digital (DMR)',
      'Compatible con IP Site Connect y Capacity Plus para escalar tu sistema',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/r2-1.jpg'),
      medio('products/r2-2.jpg'),
      medio('products/r2-3.jpg'),
      medio('products/r2-4.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-magone-x10d', 8, {
    nombre: 'Motorola MagOne X10d',
    slug: 'magone-x10d',
    categoria: 'radios-portatiles',
    resumen:
      'Diseñado para el ritmo del mundo empresarial: tiendas, eventos y colegios. Es el radio con mayor volumen de toda la familia Mag One y se carga con un simple cargador USB-C, sin cargador propietario.',
    tipo: 'Portátil analógico/digital',
    banda: 'VHF 136–174 MHz (5W) · UHF 400–470 MHz (4W) · UHF 450–527 MHz (4W)',
    specs: [
      'Hasta 23 horas de autonomía en modo digital (16 horas en analógico), para un turno completo y más',
      'Salida de audio de hasta 3W, la más potente de toda la familia MagOne',
      'Puerto USB-C: se carga y programa con un cargador USB común, en cualquier lugar',
      'Cancelación de ruido para un audio nítido incluso en entornos ruidosos',
      'Botón de emergencia dedicado, trabajador solitario y monitoreo remoto para proteger a tu personal',
      'Grabación de voz de hasta 8 horas y anuncios de canal personalizados',
      '3 botones programables y VOX para operación manos libres',
      'Certificación IP55 y estándares militares (salitre, golpes, neblina)',
    ],
    aplicaciones: ['Tiendas', 'Eventos', 'Colegios'],
    fotos: [
      medio('products/magone-x10d-1.jpg'),
      medio('products/magone-x10d-2.jpg'),
      medio('products/magone-x10d-3.jpg'),
      medio('products/magone-x10d-4.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-dep570e', 9, {
    nombre: 'Motorola MOTOTRBO DEP 570e',
    slug: 'dep570e',
    categoria: 'radios-portatiles',
    resumen:
      'El más completo de la Serie DEP 500e: teclado limitado con pantalla, Wi-Fi integrado, audio Bluetooth y hasta 27 horas de batería, con clasificación IP67 para resistir agua y polvo.',
    tipo: 'Portátil con teclado limitado y pantalla',
    banda: 'VHF 136–174 MHz (5W) / 350 350–400 MHz (4W) / UHF 403–527 MHz (4W)',
    specs: [
      '128 canales y 4 botones programables',
      'Wi-Fi integrado: actualización de firmware por aire (OTAP) y administración remota de la flota',
      'Audio Bluetooth® con ubicación y seguimiento en interiores, sin cables',
      'Receptor mejorado: hasta 8% más de alcance',
      'Hasta 27 horas de batería con la nueva administración de energía (batería de alta capacidad)',
      'Certificación IP67: sumergible, no solo resistente, y estándar MIL-STD 810',
      'Modelos HazLoc disponibles, con aprobación UL (TIA-4950) para zonas con gases o material inflamable',
      'Desactivación remota del radio en caso de robo y administración de baterías IMPRES',
      'Compatible con IP Site Connect, Capacity Plus (un sitio y multisitio) y Modo directo de capacidad dual',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/dep570e-1.png'),
      medio('products/dep570e-2.png'),
      medio('products/dep570e-3.png'),
      medio('products/dep570e-4.png'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-dep550e', 10, {
    nombre: 'Motorola MOTOTRBO DEP 550e',
    slug: 'dep550e',
    categoria: 'radios-portatiles',
    resumen:
      'La versión sin teclado ni pantalla de la Serie DEP 500e: la misma conectividad Wi-Fi y Bluetooth, la misma resistencia IP67 y hasta 27 horas de batería, en un radio más simple de operar.',
    tipo: 'Portátil sin teclado ni pantalla',
    banda: 'VHF 136–174 MHz (5W) / 350 350–400 MHz (4W) / UHF 403–527 MHz (4W)',
    specs: [
      '64 canales y 2 botones programables',
      'Wi-Fi integrado: actualización de firmware por aire (OTAP) y administración remota de la flota',
      'Audio Bluetooth® con ubicación y seguimiento en interiores, sin cables',
      'Receptor mejorado: hasta 8% más de alcance',
      'Hasta 27 horas de batería con la nueva administración de energía (batería de alta capacidad)',
      'Certificación IP67: sumergible, no solo resistente, y estándar MIL-STD 810',
      'Modelos HazLoc disponibles, con aprobación UL (TIA-4950) para zonas con gases o material inflamable',
      'Desactivación remota del radio en caso de robo y administración de baterías IMPRES',
      'Compatible con IP Site Connect, Capacity Plus (un sitio y multisitio) y Modo directo de capacidad dual',
    ],
    aplicaciones: [],
    fotos: [medio('products/dep550e-1.jpg')],
    esPlaceholder: 'no',
  }),
  item('prod-dep450', 11, {
    nombre: 'Motorola MOTOTRBO DEP 450',
    slug: 'dep450',
    categoria: 'radios-portatiles',
    resumen:
      'Comunicación digital eficiente y accesible para el día a día: rinde hasta un 40% más de batería que un radio analógico y duplica la capacidad de tu canal, sin comprar un repetidor.',
    tipo: 'Portátil digital',
    banda: 'VHF 136–174 MHz (5W) / 350 350–400 MHz (4W) / UHF1 403–470 MHz (4W) / UHF2 450–527 MHz (4W)',
    specs: [
      '32 canales y hasta 19 horas de batería digital con la batería de alta capacidad',
      'Duplica la capacidad de tu canal de 12,5 kHz con el Modo directo de capacidad dual, sin comprar un repetidor',
      'Cancelación de ruido digital: se escucha con claridad incluso sobre el ruido de maquinaria',
      'AGC digital: sube el volumen automáticamente para quien necesita susurrar',
      'Durabilidad probada: IP54 y pruebas de vida acelerada que simulan 5 años de uso intensivo',
      'Privacidad básica digital para proteger tus llamadas',
      'Botón de ayuda con solo un toque en los botones laterales programables',
      '2 años de garantía estándar',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/dep450-1.jpg'),
      medio('products/dep450-2.jpg'),
      medio('products/dep450-3.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-dep250', 12, {
    nombre: 'Motorola MOTOTRBO DEP 250',
    slug: 'dep250',
    categoria: 'radios-portatiles',
    resumen:
      'Tu puerta de entrada al mundo digital: pasa de analógico a digital sin complicaciones y sin perder tu inversión, reutilizando tus baterías, antenas, cargadores y audífonos existentes.',
    tipo: 'Portátil analógico/digital',
    banda: 'VHF 136–174 MHz (5W) / 350 350–400 MHz (4W, versión digital) / UHF 403–480 MHz (4W)',
    specs: [
      '16 canales (sin teclado) o 160 canales (con teclado limitado, versión analógica)',
      'Migración a tu ritmo: funciona en analógico y en digital (DMR)',
      'Protege tu inversión: compatible con baterías, antenas, cargadores y audífonos existentes',
      'Audio más claro en digital: rechaza la estática y el ruido de fondo',
      'Duplica los canales con el Modo directo de capacidad doble, sin repetidor',
      'Mensajes de texto preprogramados con solo presionar un botón',
      'Cobertura ampliable con IP Site Connect',
      'Hecho para durar: IP54 y pruebas de caída, choque térmico, vibración y polvo',
    ],
    aplicaciones: ['Hotelería', 'Industria ligera', 'Administración de eventos'],
    fotos: [medio('products/dep250-1.png')],
    esPlaceholder: 'no',
  }),
  item('prod-slr1000', 13, {
    nombre: 'Motorola MOTOTRBO SLR1000',
    slug: 'slr1000',
    categoria: 'repetidoras',
    resumen:
      'El repetidor compacto para sitios pequeños y medianos: cobertura sin complicaciones para comercios, colegios, hoteles o edificios, con funcionamiento continuo y resistencia a polvo y agua.',
    tipo: 'Repetidor',
    banda: 'VHF 136–174 MHz / UHF 400–527 MHz',
    specs: [
      'Potencia de salida de 1 a 10 W, con ciclo de operación del 100%',
      '64 canales y alta sensibilidad de recepción (0,22 µV típica)',
      'Compacto y robusto: certificación IP65, apenas 4,54 kg',
      'Flexible: modos half duplex y duplex',
      'Compatible con Conventional Digital, IP Site Connect, Capacity Plus, Capacity Max y Connect Plus',
      'También opera en analógico (incluye MPT 1327), para migrar a tu propio ritmo',
      'Conectividad Tx/Rx N hembra, USB B, Ethernet y conector para accesorios RJ45',
    ],
    aplicaciones: ['Comercios', 'Colegios', 'Hoteles', 'Edificios'],
    fotos: [
      medio('products/slr1000-1.jpg'),
      medio('products/slr1000-2.jpg'),
      medio('products/slr1000-3.jpg'),
      medio('products/slr1000-4.jpg'),
      medio('products/slr1000-5.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-slr5100', 14, {
    nombre: 'Motorola MOTOTRBO SLR5100',
    slug: 'slr5100',
    categoria: 'repetidoras',
    resumen:
      'El repetidor de próxima generación: hasta 50W de potencia, funcionamiento 24/7 y un formato compacto de 1RU que ahorra espacio en el rack, diseñado para durar y crecer con tu operación.',
    tipo: 'Repetidor',
    banda: 'VHF 136–174 MHz / UHF1 400–470 MHz / UHF2 450–512 MHz / 350–400 MHz',
    specs: [
      'Potencia de salida de 1 a 50 W, a ciclo de operación del 100%',
      '10 veces más capacidad de procesamiento, 15 veces más memoria y 125 veces más almacenamiento que las repetidoras de primera generación',
      'Módulos de módem, fuente y amplificador reemplazables en campo, para menos mantenimiento',
      'Tecnología de RF de alta eficiencia energética',
      'Cargador de batería de 3A integrado, con salida auxiliar de 12V/1A',
      'Formato 1RU que ahorra espacio en el rack',
      'Puerto USB en el panel frontal para una configuración fácil',
      'Compatible con todas las arquitecturas MOTOTRBO, incluye Capacity Max y Connect Plus',
      '3 años de garantía (Essential Services)',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/slr5100-1.jpg'),
      medio('products/slr5100-2.jpg'),
      medio('products/slr5100-3.jpg'),
      medio('products/slr5100-4.jpg'),
      medio('products/slr5100-5.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-slr8000', 15, {
    nombre: 'Motorola MOTOTRBO SLR 8000',
    slug: 'slr8000',
    categoria: 'repetidoras',
    resumen:
      'El repetidor de alto desempeño: hasta 100W de potencia y un receptor de alta sensibilidad, pensado para cubrir grandes extensiones y rendir en los sitios más congestionados.',
    tipo: 'Repetidor',
    banda: 'VHF 136–174 MHz / UHF 400–470 MHz / 800 MHz / 900 MHz',
    specs: [
      'Potencia de salida de hasta 100 W (con alimentación DC 24V o AC) y 50 W en DC 12V',
      'Bandas para cualquier necesidad: VHF, UHF, 800 y 900 MHz',
      'Recepción excepcional: bloqueo superior a 110 dB y alto rechazo de intermodulación',
      'Monitoreo remoto de corriente, voltaje, potencia de salida, temperatura y VSWR (compatible con RDAC)',
      'Instalación eficiente en formato 2U, de "caja única", sin espacio libre de ventilación arriba ni abajo',
      'Cargador de baterías integrado y alimentación de 100–240 VCA, 12/24 VCC o CA con respaldo de batería',
      'Compatible con Conventional Digital, IP Site Connect, Capacity Plus, Capacity Max y Connect Plus',
      '2 años de garantía estándar, ampliable con Service from the Start',
    ],
    aplicaciones: [],
    fotos: [
      medio('products/slr8000-1.jpg'),
      medio('products/slr8000-2.jpg'),
      medio('products/slr8000-3.jpg'),
      medio('products/slr8000-4.jpg'),
      medio('products/slr8000-5.jpg'),
    ],
    esPlaceholder: 'no',
  }),
  item('prod-r5-accesorios-originales', 16, {
    nombre: 'Otros accesorios originales Motorola MOTOTRBO R5',
    slug: 'r5-accesorios-originales',
    categoria: 'accesorios-originales',
    resumen:
      'Personaliza tu MOTOTRBO R5 con los únicos accesorios diseñados, construidos y probados junto con el radio: audífonos, antenas, fundas y más. El micrófono, la batería IMPRES y el cargador multiunidad tienen su propia ficha.',
    tipo: 'Accesorios',
    banda: 'Compatibles con MOTOTRBO R5',
    specs: [
      'Accesorios inalámbricos Bluetooth® para operaciones críticas (WM500, RM730 y RM760)',
      'Auriculares y audífonos: D-Shell ajustable, tubo transparente y kits de bajo ruido (hasta 24 dB de reducción)',
      'Auriculares discretos con micrófono y PTT integrado, para vigilancia y uso encubierto',
      'Antenas UHF y VHF en formatos flexible, helicoidal y reducida, con opción de combinación GPS',
      'Cargadores unitarios para carga individual (la versión multiunidad IMPRES tiene su propia ficha)',
      'Fundas de transporte en cuero rígido o nailon, con pasador giratorio o fijo',
    ],
    aplicaciones: [],
    fotos: [],
    esPlaceholder: 'no',
  }),
  item('prod-r5-microfono-rm560', 17, {
    nombre: 'Micrófono con altavoz remoto Motorola RM560 / RM530',
    slug: 'r5-microfono-rm560',
    categoria: 'accesorios-originales',
    resumen:
      'Micrófono con altavoz remoto para tu MOTOTRBO R5, con supresión de ruido entrenada por inteligencia artificial y un cable de Kevlar® ultrarresistente, para escucharte claro incluso en exteriores.',
    tipo: 'Accesorio · Micrófono con altavoz remoto',
    banda: 'Compatible con MOTOTRBO R5',
    specs: [
      'Dos tamaños disponibles: RM560 (grande) y RM530 (pequeño), ambos con certificación IP67',
      'Supresión de ruido entrenada por inteligencia artificial, para una voz clara en ambientes ruidosos',
      'Windporting: reduce el ruido del viento en exteriores',
      'Cable de Kevlar® ultrarresistente, pensado para uso intensivo',
      'Tecnología IMPRES de audio y energía',
      'Opciones de resistencia IP54, IP55 e IP57 (sumergible), según el modelo',
    ],
    aplicaciones: [],
    fotos: [medio('products/r5-microfono-rm560-1.jpg')],
    esPlaceholder: 'no',
  }),
  item('prod-r5-bateria-impres', 18, {
    nombre: 'Batería IMPRES Motorola PMNN4888 / PMNN4889',
    slug: 'r5-bateria-impres',
    categoria: 'accesorios-originales',
    resumen:
      'Batería de repuesto IMPRES para tu MOTOTRBO R5, con certificación IP67 y dos capacidades disponibles para ajustarse a la duración de tu turno de trabajo.',
    tipo: 'Accesorio · Batería',
    banda: 'Compatible con MOTOTRBO R5',
    specs: [
      'PMNN4888: versión delgada, de 2200 mAh',
      'PMNN4889: versión de alta capacidad, de 3200 mAh',
      'PMNN4890: versión de 3200 mAh con certificación UL',
      'Certificación IP67, resistente al agua y al polvo',
      'Tecnología IMPRES: administración inteligente de carga junto con cargadores y radios compatibles',
    ],
    aplicaciones: [],
    fotos: [medio('products/r5-bateria-impres-1.jpg')],
    esPlaceholder: 'no',
  }),
  item('prod-r5-cargador-multiunidad', 19, {
    nombre: 'Cargador multiunidad IMPRES Motorola PMPN4283',
    slug: 'r5-cargador-multiunidad',
    categoria: 'accesorios-originales',
    resumen:
      'Cargador multiunidad IMPRES para cargar varios radios o baterías R5 al mismo tiempo, pensado para flotas de equipos que rotan de turno.',
    tipo: 'Accesorio · Cargador multiunidad',
    banda: 'Compatible con MOTOTRBO R5',
    specs: [
      'Carga varios radios o baterías al mismo tiempo (PMPN4283)',
      'Tecnología IMPRES: administración inteligente de carga que prolonga la vida útil de la batería',
      'Compatible con baterías de ion de litio y NiMH',
      'Alimentación universal 100–240 VCA',
      'Indicador de estado de carga por cada unidad',
    ],
    aplicaciones: [],
    fotos: [medio('products/r5-cargador-multiunidad-1.jpg')],
    esPlaceholder: 'no',
  }),
];

// ─── Servicios ───────────────────────────────────────────────────────────

export const servicios = [
  item('serv-venta-radios', 1, {
    titulo: 'Venta de radios y accesorios',
    slug: 'venta-radios',
    gancho: 'Equipos profesionales para mantener a tu equipo conectado.',
    descripcion:
      'Consulta radios Motorola y accesorios originales para distintos tipos de operación. Te asesoramos según el entorno de uso, la cantidad de usuarios y la cobertura que necesitas.',
    textoBoton: 'Consultar equipos',
    motivo: 'Catálogo Motorola',
    icono: 'radio-handheld',
  }),
  item('serv-alquiler-radios', 2, {
    titulo: 'Alquiler de radios y frecuencias',
    slug: 'alquiler-radios',
    gancho: 'Una alternativa flexible para proyectos y operaciones temporales.',
    descripcion:
      'Consulta la disponibilidad de radios y alternativas de frecuencia para tu operación. El alcance, las condiciones y la compatibilidad se revisan según la ubicación y el requerimiento.',
    textoBoton: 'Consultar alquiler',
    motivo: 'Alquiler',
    icono: 'radio-mobile',
  }),
  item('serv-mantenimiento', 3, {
    titulo: 'Mantenimiento y reparación',
    slug: 'mantenimiento',
    gancho: 'Atención técnica para tus equipos de radiocomunicación.',
    descripcion:
      'Solicita una revisión para identificar el estado del equipo y las opciones de mantenimiento o reparación. Comparte el modelo, la cantidad de equipos y una descripción de la falla para iniciar la consulta.',
    textoBoton: 'Solicitar revisión técnica',
    motivo: 'Mantenimiento o reparación',
    icono: 'wrench',
  }),
  item('serv-sitios-repeticion', 4, {
    titulo: 'Alquiler de sitios de repetición',
    slug: 'sitios-repeticion',
    gancho: 'Infraestructura para ampliar las posibilidades de comunicación.',
    descripcion:
      'Consulta sitios de repetición disponibles y su posible aplicación a tu sistema. La ubicación y viabilidad deben evaluarse para cada proyecto.',
    textoBoton: 'Consultar sitios disponibles',
    motivo: 'Infraestructura',
    icono: 'tower',
  }),
  item('serv-espacio-fisico', 5, {
    titulo: 'Alquiler de espacio físico',
    slug: 'espacio-fisico',
    gancho: 'Espacio para instalaciones de telecomunicaciones.',
    descripcion:
      'Consulta opciones de espacio físico para instalar infraestructura de telecomunicaciones. Comparte la ubicación y los requerimientos técnicos para revisar disponibilidad y factibilidad.',
    textoBoton: 'Consultar disponibilidad',
    motivo: 'Infraestructura',
    icono: 'building',
  }),
  item('serv-estudios-ingenieria', 6, {
    titulo: 'Estudios de ingeniería',
    slug: 'estudios-ingenieria',
    gancho: 'Planificación técnica para una solución adecuada a tu zona.',
    descripcion:
      'Consulta estudios de ingeniería y asesoría para sistemas de radiocomunicación. El alcance se define según el proyecto, las necesidades de cobertura y los requisitos técnicos aplicables.',
    textoBoton: 'Conversar sobre mi proyecto',
    motivo: 'Estudios de ingeniería',
    icono: 'compass',
  }),
];

// ─── Sectores ────────────────────────────────────────────────────────────

export const sectores = [
  item('sec-seguridad-privada', 1, {
    titulo: 'Seguridad privada',
    slug: 'seguridad-privada',
    descripcion:
      'Facilita la coordinación entre personal, supervisores y centros de operación. Consulta radios, accesorios, cobertura y alternativas de alquiler para las características de tu servicio.',
    icono: 'shield',
  }),
  item('sec-transporte-logistica', 2, {
    titulo: 'Transporte y logística',
    slug: 'transporte-logistica',
    descripcion:
      'Mantén coordinadas las comunicaciones entre conductores, despachadores y personal operativo. Cuéntanos tus rutas y puntos de trabajo para revisar las alternativas disponibles.',
    icono: 'truck',
  }),
  item('sec-operaciones-industriales', 3, {
    titulo: 'Operaciones industriales y de campo',
    slug: 'operaciones-industriales',
    descripcion:
      'Consulta equipos y sistemas para personal distribuido en instalaciones, plantas o zonas de trabajo. La recomendación dependerá del entorno y de la cobertura requerida.',
    icono: 'factory',
  }),
  item('sec-agricultura-camaroneras', 4, {
    titulo: 'Agricultura y camaroneras',
    slug: 'agricultura-camaroneras',
    descripcion:
      'Revisa alternativas para coordinar personal y equipos en operaciones extensas o distribuidas. Podemos conversar sobre radios, cobertura e infraestructura según la ubicación.',
    icono: 'leaf',
  }),
  item('sec-instituciones-publicas', 5, {
    titulo: 'Instituciones y servicios públicos',
    slug: 'instituciones-publicas',
    descripcion:
      'Consulta opciones de radiocomunicación para equipos que requieren coordinación operativa. La solución se define de acuerdo con el alcance, el entorno y las especificaciones del proyecto.',
    icono: 'building',
  }),
];

// ─── Cobertura ───────────────────────────────────────────────────────────

export const zonas = [
  item('zona-costa-sur-occidente', 1, {
    titulo: 'Cobertura 1 · Costa sur y occidente',
    slug: 'costa-sur-occidente',
    descripcion:
      'Cobertura en UHF y VHF sobre el área costanera del sur y occidente del país, con presencia aproximada en Los Ríos (80%), El Oro (85%), Guayas (90%), Santa Elena (90%), Bolívar (50%) y Manabí (45%). Opera los 365 días del año, con una eficacia de operación anual cercana al 97%.',
    notaInteres:
      'Una de las mejores alternativas para clientes con operaciones interprovinciales: seguridad, transporte, minería, agricultura, camaroneras y entidades públicas (GAD municipales y organismos de tránsito).',
    pendienteValidacion: 'si',
  }),
  item('zona-guayaquil-alrededores', 2, {
    titulo: 'Cobertura 2 · Guayaquil y alrededores',
    slug: 'guayaquil-alrededores',
    descripcion:
      'Cobertura en UHF y VHF sobre el área metropolitana de Guayaquil, con un alcance aproximado del 99% dentro de la ciudad y de 40 a 60 km a su alrededor. Eficacia de operación anual cercana al 99.67%.',
    notaInteres:
      'Una alternativa robusta para empresas portuarias, transporte privado y público, y organizaciones públicas o privadas que necesiten comunicación rápida y coordinada.',
    pendienteValidacion: 'si',
  }),
  item('zona-costa-guayas-el-oro', 3, {
    titulo: 'Cobertura 3 · Costa de Guayas y El Oro',
    slug: 'costa-guayas-el-oro',
    descripcion:
      'Cobertura en UHF y VHF sobre el área costanera de Guayas y El Oro, incluyendo el golfo de Guayaquil, con una eficacia de operación anual cercana al 99.30%.',
    notaInteres:
      'Puede ser relevante para camaroneras, transporte interprovincial y entidades públicas que requieran movilidad efectiva en el sitio de operación.',
    pendienteValidacion: 'si',
  }),
  item('zona-suroccidente', 4, {
    titulo: 'Cobertura 4 · Suroccidente',
    slug: 'suroccidente',
    descripcion:
      'Cobertura mixta sobre el área suroccidental del país, con un alcance aproximado del 90% en Guayas, El Oro y Santa Elena, y una eficacia de operación anual cercana al 97%.',
    notaInteres:
      'Una alternativa para empresas portuarias, transporte privado y público, y organizaciones públicas o privadas que requieran comunicación eficaz y coordinada.',
    pendienteValidacion: 'si',
  }),
  item('zona-multisitio', 5, {
    titulo: 'Cobertura ampliada · Sistemas multisitio',
    slug: 'multisitio',
    descripcion:
      'Integración de sitios de repetición en una configuración multisitio en tiempo real, dentro de las zonas indicadas o a nivel nacional según el requerimiento del cliente, con un tráfico efectivo anual cercano al 98%.',
    notaInteres: 'La viabilidad y el alcance exactos dependen del proyecto y deben confirmarse con el equipo técnico.',
    pendienteValidacion: 'si',
  }),
];

// ─── FAQ ─────────────────────────────────────────────────────────────────

export const preguntas = [
  item('faq-precios-catalogo', 1, {
    pregunta: '¿Puedo consultar precios en el catálogo?',
    respuesta:
      'El catálogo es informativo y no muestra precios. Puedes consultar disponibilidad, especificaciones y una cotización para el producto que te interesa.',
  }),
  item('faq-que-radio-necesito', 2, {
    pregunta: '¿Qué radio necesita mi empresa?',
    respuesta:
      'Depende de la zona de operación, el entorno, la cobertura requerida, el número de usuarios y la infraestructura disponible. Cuéntanos estos datos para recibir orientación.',
  }),
  item('faq-cobertura-garantia', 3, {
    pregunta: '¿La cobertura indicada garantiza señal en toda la zona?',
    respuesta:
      'No necesariamente. La cobertura es referencial y debe evaluarse para la ubicación y las condiciones específicas de cada operación.',
  }),
  item('faq-alquiler-temporal', 4, {
    pregunta: '¿Puedo alquilar radios para un proyecto temporal?',
    respuesta:
      'Puedes consultar la disponibilidad de alquiler indicando las fechas, la ubicación, el número aproximado de radios y el tipo de operación.',
  }),
  item('faq-reparacion-mantenimiento', 5, {
    pregunta: '¿Puedo solicitar reparación o mantenimiento?',
    respuesta: 'Sí. Comparte el modelo del equipo, la cantidad y una descripción de la falla para solicitar una revisión técnica.',
  }),
  item('faq-estudios-ingenieria', 6, {
    pregunta: '¿Ofrecen estudios de ingeniería?',
    respuesta:
      'Wellbusiness ofrece estudios de ingeniería para sistemas de radiocomunicación. El alcance y los entregables se confirman según las características de cada proyecto.',
  }),
];

// ─── Marcas / logos ──────────────────────────────────────────────────────

export const marcas = [
  item('marca-claro', 1, { nombre: 'Claro', logo: medio('logos/claro.png') }),
  item('marca-grandstream', 2, { nombre: 'Grandstream', logo: medio('logos/grandstream.png') }),
  item('marca-huawei', 3, { nombre: 'Huawei', logo: medio('logos/huawei.png') }),
  item('marca-hustler', 4, { nombre: 'Hustler', logo: medio('logos/hustler.png') }),
  item('marca-l-com', 5, { nombre: 'L-com', logo: medio('logos/l-com-global.png') }),
  item('marca-motorola-waveptx', 6, {
    nombre: 'Motorola WAVE PTX',
    logo: medio('logos/motorola-waveptx.png'),
  }),
  item('marca-pctel', 7, { nombre: 'PCTEL', logo: medio('logos/pctel.png') }),
  item('marca-rf-elements', 8, { nombre: 'RF Elements', logo: medio('logos/rf-elements.png') }),
  item('marca-sinclair', 9, { nombre: 'Sinclair', logo: medio('logos/sinclair.png') }),
  item('marca-smartptt', 10, { nombre: 'SmartPTT', logo: medio('logos/smartptt.png') }),
  item('marca-tassta', 11, { nombre: 'Tassta', logo: medio('logos/tassta.png') }),
  item('marca-telosystems', 12, { nombre: 'TeloSystems', logo: medio('logos/telosystems.png') }),
  item('marca-telox', 13, { nombre: 'Telox', logo: medio('logos/telox.png') }),
  item('marca-tram-browning', 14, { nombre: 'Tram Browning', logo: medio('logos/tram-browning.png') }),
  item('marca-zetron', 15, { nombre: 'Zetron', logo: medio('logos/zetron.png') }),
];

// ─── Accesos rápidos (home) ──────────────────────────────────────────────
// Transcritos de las 4 <QuickLinkCard> hardcodeadas en apps/web/src/pages/index.astro.

export const accesosRapidos = [
  item('acceso-radios-motorola', 1, {
    titulo: 'Radios Motorola',
    descripcion: 'Explora radios profesionales y accesorios originales para las necesidades de tu empresa.',
    enlace: '/catalogo',
    textoBoton: 'Ver catálogo',
    icono: 'radio-handheld',
  }),
  item('acceso-alquiler-radios', 2, {
    titulo: 'Alquiler de radios',
    descripcion: 'Equipa operaciones temporales o consulta alternativas de alquiler para tu proyecto.',
    enlace: '/servicios#alquiler-radios',
    textoBoton: 'Consultar alquiler',
    icono: 'radio-mobile',
  }),
  item('acceso-servicio-tecnico', 3, {
    titulo: 'Servicio técnico',
    descripcion: 'Solicita mantenimiento, diagnóstico o reparación para tus equipos de radiocomunicación.',
    enlace: '/servicios#mantenimiento',
    textoBoton: 'Solicitar servicio técnico',
    icono: 'wrench',
  }),
  item('acceso-cobertura-infraestructura', 4, {
    titulo: 'Cobertura e infraestructura',
    descripcion: 'Consulta las zonas, sitios de repetición y alternativas disponibles para tu operación.',
    enlace: '/cobertura',
    textoBoton: 'Explorar cobertura',
    icono: 'tower',
  }),
];

// ─── Valores (Nosotros) ──────────────────────────────────────────────────

export const valores = [
  item('valor-respeto', 1, {
    titulo: 'Respeto',
    descripcion:
      'Todas nuestras relaciones internas y externas se desarrollan con cuidado, sin vulnerar los derechos de los demás.',
    icono: 'shield',
  }),
  item('valor-responsabilidad', 2, {
    titulo: 'Responsabilidad',
    descripcion:
      'Cumplimos cada uno de nuestros compromisos con nuestros clientes, nuestro equipo, la comunidad y el medio ambiente.',
    icono: 'check',
  }),
  item('valor-seriedad', 3, {
    titulo: 'Seriedad',
    descripcion:
      'Acompañamos y asesoramos a nuestros clientes en todo momento, anticipándonos a sus necesidades con propuestas innovadoras orientadas a la mejora continua.',
    icono: 'compass',
  }),
  item('valor-confidencialidad', 4, {
    titulo: 'Confidencialidad',
    descripcion:
      'Protegemos la información, la seguridad y los datos confidenciales de nuestros clientes y colaboradores en cada uno de nuestros procesos.',
    icono: 'building',
  }),
];
