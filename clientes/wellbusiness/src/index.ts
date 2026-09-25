/**
 * Configuración de Wellbusiness para el portal.
 * Para instalar el portal a otro cliente se copia esta carpeta y se cambia.
 */
import { definirCliente } from '@cms/core/cliente';
import logo from '../assets/logo.png?url';
import { bloques, etiquetasSitio } from './bloques';
import * as contenido from './colecciones';
import { colecciones } from './esquemas';

export default definirCliente({
  id: 'wellbusiness',
  nombre: 'Wellbusiness',
  sitio: { url: 'https://idrocomsolutions.com' },
  portal: {
    titulo: 'Portal Wellbusiness',
    logo,
    // Steel (--color-brand-steel en apps/web/src/styles/global.css) — el
    // tono principal de marca, no el ink oscuro ni el rojo de acento.
    colorAcento: '#2867a5',
    requiereAprobacion: false,
    diasPapelera: 30,
    zonaHoraria: 'America/Guayaquil',
    editores: { eliminar: false },
    // Workers KV del plan gratuito: 1 GB para toda la cuenta, compartido con
    // fluvida-portal (misma cuenta de Cloudflare, namespace fluvida-medios).
    // Reparto acordado: Wellbusiness 400 MB + Fluvida 500 MB = 900 MB, deja
    // ~100 MB de margen bajo el límite real de 1 GB. Si este límite sube,
    // hay que bajar el de Fluvida (fluvida-web/clientes/fluvida/src/index.ts,
    // otro repo) para que la suma no pase de 1 GB.
    almacenamiento: { tipo: 'kv', limiteBytes: 400 * 1024 * 1024 },
  },
  etiquetas: { paginas: etiquetasSitio.paginas, secciones: etiquetasSitio.secciones },
  bloques,
  colecciones,
  formularios: {
    contacto: {
      etiqueta: 'Contacto',
      campos: {
        nombre: 'Nombre y apellido',
        empresa: 'Empresa',
        correo: 'Correo electrónico',
        telefono: 'Teléfono / WhatsApp',
        ciudad: 'Ciudad',
        motivo: 'Motivo de consulta',
        producto: 'Producto o modelo de interés',
        mensaje: 'Mensaje',
      },
      opciones: {
        motivo: {
          'Catálogo Motorola': 'Catálogo Motorola',
          Alquiler: 'Alquiler',
          'Mantenimiento o reparación': 'Mantenimiento o reparación',
          Cobertura: 'Cobertura',
          Infraestructura: 'Infraestructura',
          'Estudios de ingeniería': 'Estudios de ingeniería',
          Otro: 'Otro',
        },
      },
    },
    'evaluacion-cobertura': {
      etiqueta: 'Evaluación de cobertura',
      campos: {
        nombre: 'Nombre',
        empresa: 'Empresa',
        correo: 'Correo electrónico',
        telefono: 'Teléfono / WhatsApp',
        zonas: 'Ciudad, zonas o rutas de operación',
        tipoOperacion: 'Tipo de operación',
        usuarios: 'Número aproximado de usuarios',
        mensaje: 'Cuéntanos qué necesitas',
      },
    },
  },
  contenidoInicial: {
    colecciones: {
      categorias: contenido.categorias,
      productos: contenido.productos,
      servicios: contenido.servicios,
      sectores: contenido.sectores,
      zonas: contenido.zonas,
      preguntas: contenido.preguntas,
      marcas: contenido.marcas,
      accesosRapidos: contenido.accesosRapidos,
      valores: contenido.valores,
    },
    // Sin envíos de ejemplo: los formularios públicos todavía no guardan
    // nada real (Fase 5), así que no hay nada honesto que simular todavía.
    enviosEjemplo: [],
  },
});
