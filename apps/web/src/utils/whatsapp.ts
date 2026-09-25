/**
 * `wa.me` necesita solo dígitos (sin "+", espacios ni el 0 inicial ya lo
 * trae el número real). Antes leía `CONTACT_INFO.whatsapp` como módulo;
 * ahora ese número viene del bloque `global.contacto.whatsapp` (Fase 4),
 * así que esta función lo recibe como parámetro en vez de importarlo.
 */
export function whatsappLink(numero: string, mensaje?: string): string {
  const digitos = numero.replace(/\D/g, "");
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
  return `https://wa.me/${digitos}${texto}`;
}
