/**
 * Textos del portal que dependen de la configuración del cliente
 * (género de las colecciones, fechas en la zona horaria del cliente).
 * Se usan en el servidor y en el navegador.
 */

export interface Nombrable {
  singular: string;
  genero: 'f' | 'm';
}

/** "la noticia", "el programa", "el área" (femeninas con "á" tónica usan "el"). */
export function conArticulo(c: Nombrable) {
  const articulo = c.genero === 'f' && !/^[áa]/i.test(c.singular) ? 'la' : 'el';
  return `${articulo} ${c.singular}`;
}

/** "Nueva noticia", "Nuevo programa". */
export function nuevo(c: Nombrable) {
  return `${c.genero === 'f' ? 'Nueva' : 'Nuevo'} ${c.singular}`;
}

/** "Guardada", "Guardado". */
export function participio(c: Nombrable, raiz: string) {
  return `${raiz}${c.genero === 'f' ? 'a' : 'o'}`;
}

export function formatearFechaHora(iso: string | number | Date, zona: string) {
  const fecha = new Date(iso);
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: zona,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function formatearFecha(iso: string | number | Date, zona: string) {
  return new Intl.DateTimeFormat('es-EC', { timeZone: zona, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** "hace 5 minutos", "ayer", "el 3 de octubre". */
export function haceCuanto(iso: string | number | Date, zona: string) {
  const fecha = new Date(iso);
  const seg = Math.round((Date.now() - fecha.getTime()) / 1000);
  if (seg < 60) return 'hace un momento';
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return `el ${new Intl.DateTimeFormat('es-EC', { timeZone: zona, day: 'numeric', month: 'long' }).format(fecha)}`;
}
