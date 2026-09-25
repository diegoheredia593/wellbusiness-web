/**
 * Sube las fotos reales de Wellbusiness (productos y marcas) a la
 * biblioteca de medios del portal — nunca las deja como archivos estáticos
 * de `apps/web`, para que se vean bien sin importar en qué dominio viva
 * cada app (confirmado con `apps/web/public/images/...` roto en el portal:
 * esas rutas solo existen en el dominio del sitio, no en el del portal).
 *
 * Reutiliza el flujo real del portal (`POST /api/medios`, la misma ruta
 * que usa el recorte por navegador) en vez de escribir a mano en D1/KV —
 * así toda la validación de tipo/peso/medidas (`inspeccionar()`,
 * `guardarFoto()`) es exactamente la misma que ya usa el portal, y el
 * script funciona igual contra un portal local (`astro dev`) o contra uno
 * real ya desplegado, solo cambiando `--url`.
 *
 * Idempotente: antes de subir una foto, busca en la biblioteca una que
 * tenga exactamente el mismo texto alternativo (único por foto, generado
 * más abajo) y la reutiliza en vez de duplicarla.
 *
 * Uso:
 *   npx tsx scripts/importar-fotos.ts --url http://localhost:4321 \
 *     --email admin@ejemplo.com --password "clave"
 *
 * Al terminar, escribe `clientes/wellbusiness/src/medios-generados.ts`
 * con el id real de cada foto — `colecciones.ts` lo consume vía el
 * ayudante `medio()` de `./medios.ts`.
 *
 * ORDEN EXACTO PARA PRODUCCIÓN (el portal valida el paso 4 — ver
 * `apps/portal/src/lib/servidor/carga.ts`, "Falta la foto..." — así que
 * saltarse un paso da un error claro, nunca fichas con fotos rotas):
 *   1. Este script, contra el portal YA DESPLEGADO (`--url https://...`).
 *   2. Revisar y comitear `clientes/<cliente>/src/medios-generados.ts`.
 *   3. Desplegar el portal (push a la rama de producción, o
 *      `npm run deploy:portal`) — así el código que corre en Cloudflare
 *      conoce los ids que se acaban de subir.
 *   4. Recién ahora: `--cargar` (o el botón "Cargar" en `/carga-inicial`).
 *
 * `--cargar` (opcional) hace el paso 4 sin salir de esta terminal: llama a
 * POST /api/carga-inicial. Sigue exigiendo que el paso 3 ya haya pasado —
 * no hay forma de saltárselo, porque el portal necesita estar corriendo el
 * código que ya conoce esos ids.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Args {
  url: string;
  email: string;
  password: string;
  cargar: boolean;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string, fallback?: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : fallback;
  };
  const url = get('--url', 'http://localhost:4321')!;
  const email = get('--email', process.env.PORTAL_ADMIN_EMAIL);
  const password = get('--password', process.env.PORTAL_ADMIN_PASSWORD);
  const cargar = a.includes('--cargar');
  if (!email || !password) {
    console.error('Falta --email/--password (o PORTAL_ADMIN_EMAIL/PORTAL_ADMIN_PASSWORD).');
    process.exit(1);
  }
  return { url, email, password, cargar };
}

const IMAGENES_DIR = join(import.meta.dirname, '../apps/web/public/images');

/** Mismas ~62 fotos y mismo texto alternativo que ya se habían definido en `fotos.ts`. */
interface FotoAImportar {
  clave: string; // p. ej. 'products/rva50-1.jpg' — se usa como key estable en medios-generados.ts
  archivo: string; // ruta real en apps/web/public/images
  alt: string;
}

const NOMBRES_PRODUCTO: Record<string, string> = {
  rva50: 'Motorola RVA50',
  dem300: 'Motorola DEM300',
  dem500: 'Motorola DEM500',
  r5: 'Motorola MOTOTRBO R5',
  sl500e: 'Motorola SL500e',
  tlk110: 'Motorola TLK110 Wave PTX',
  r2: 'Motorola MOTOTRBO R2',
  'magone-x10d': 'Motorola MagOne X10d',
  dep570e: 'Motorola MOTOTRBO DEP 570e',
  dep550e: 'Motorola MOTOTRBO DEP 550e',
  dep450: 'Motorola MOTOTRBO DEP 450',
  dep250: 'Motorola MOTOTRBO DEP 250',
  slr1000: 'Motorola MOTOTRBO SLR1000',
  slr5100: 'Motorola MOTOTRBO SLR5100',
  slr8000: 'Motorola MOTOTRBO SLR 8000',
  'r5-microfono-rm560': 'Micrófono con altavoz remoto Motorola RM560 / RM530',
  'r5-bateria-impres': 'Batería IMPRES Motorola PMNN4888 / PMNN4889',
  'r5-cargador-multiunidad': 'Cargador multiunidad IMPRES Motorola PMPN4283',
};

const NOMBRES_MARCA: Record<string, string> = {
  claro: 'Claro',
  grandstream: 'Grandstream',
  huawei: 'Huawei',
  hustler: 'Hustler',
  'l-com-global': 'L-com',
  'motorola-waveptx': 'Motorola WAVE PTX',
  pctel: 'PCTEL',
  'rf-elements': 'RF Elements',
  sinclair: 'Sinclair',
  smartptt: 'SmartPTT',
  tassta: 'Tassta',
  telosystems: 'TeloSystems',
  telox: 'Telox',
  'tram-browning': 'Tram Browning',
  zetron: 'Zetron',
};

function fotosAImportar(): FotoAImportar[] {
  const salida: FotoAImportar[] = [];
  for (const archivo of readdirSync(join(IMAGENES_DIR, 'products')).sort()) {
    const m = /^(.+?)-(\d+)\.(jpg|png)$/.exec(archivo);
    if (!m) throw new Error(`Nombre de archivo inesperado: products/${archivo}`);
    const [, base, indice] = m;
    const nombre = NOMBRES_PRODUCTO[base!];
    if (!nombre) throw new Error(`Sin nombre de producto mapeado para "products/${archivo}" (clave "${base}").`);
    salida.push({
      clave: `products/${archivo}`,
      archivo: join(IMAGENES_DIR, 'products', archivo),
      alt: `${nombre} — foto ${indice}`,
    });
  }
  for (const archivo of readdirSync(join(IMAGENES_DIR, 'logos')).sort()) {
    const base = archivo.replace(/\.png$/, '');
    const nombre = NOMBRES_MARCA[base];
    if (!nombre) throw new Error(`Sin nombre de marca mapeado para "logos/${archivo}".`);
    salida.push({ clave: `logos/${archivo}`, archivo: join(IMAGENES_DIR, 'logos', archivo), alt: nombre });
  }
  return salida;
}

interface MedioPublico {
  id: string;
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  nombre: string;
}

async function iniciarSesion(base: string, email: string, password: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base, Referer: `${base}/entrar` },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (!res.ok || !setCookie) throw new Error(`No se pudo iniciar sesión: ${res.status} ${await res.text()}`);
  return setCookie.split(';')[0]!;
}

/**
 * Busca por el nombre de archivo original (siempre corto, p. ej.
 * "rva50-1.jpg"), nunca por el texto alternativo completo — una búsqueda
 * larga (>~48 caracteres) rompe con un 500 contra el D1 local de Miniflare
 * (reproducido incluso con una cadena "aaaa..." sin ningún carácter
 * especial; no se investigó más a fondo si también ocurre contra un D1
 * real desplegado). El nombre de archivo ya es único en nuestro set y es
 * más corto, así que evita el problema en vez de perseguirlo.
 */
async function buscarPorNombreOriginal(base: string, cookie: string, nombreOriginal: string): Promise<MedioPublico | null> {
  const res = await fetch(`${base}/api/medios?buscar=${encodeURIComponent(nombreOriginal)}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`Error buscando medios: ${res.status} ${await res.text()}`);
  const { medios } = (await res.json()) as { medios: MedioPublico[] };
  // `buscar` es un LIKE (%nombre%): filtramos aquí por coincidencia exacta.
  return medios.find((m) => m.nombre === nombreOriginal) ?? null;
}

async function subirFoto(base: string, cookie: string, foto: FotoAImportar): Promise<MedioPublico> {
  const bytes = readFileSync(foto.archivo);
  const form = new FormData();
  const tipo = foto.archivo.endsWith('.png') ? 'image/png' : 'image/jpeg';
  form.set('archivo', new Blob([bytes], { type: tipo }), foto.archivo.split(/[\\/]/).pop());
  form.set('alt', foto.alt);
  const res = await fetch(`${base}/api/medios`, {
    method: 'POST',
    headers: { Cookie: cookie, Origin: base, Referer: `${base}/fotos` },
    body: form,
  });
  const cuerpo = (await res.json()) as { ok: boolean; medio?: MedioPublico; error?: string };
  if (!res.ok || !cuerpo.ok || !cuerpo.medio) throw new Error(`Error subiendo "${foto.clave}": ${res.status} ${cuerpo.error ?? ''}`);
  return cuerpo.medio;
}

/** Paso 4 del orden de producción (ver el comentario del archivo) — POST /api/carga-inicial. */
async function cargarContenidoInicial(base: string, cookie: string): Promise<void> {
  const res = await fetch(`${base}/api/carga-inicial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: base, Referer: `${base}/carga-inicial` },
    body: JSON.stringify({ accion: 'cargar' }),
  });
  const cuerpo = (await res.json()) as { ok: boolean; cargados?: number; error?: string };
  if (!res.ok || !cuerpo.ok) {
    console.error(`\nNo se pudo cargar el contenido inicial:\n${cuerpo.error ?? res.statusText}`);
    process.exit(1);
  }
  console.log(`\nContenido inicial cargado: ${cuerpo.cargados} elementos.`);
}

async function main() {
  const { url, email, password, cargar } = parseArgs();
  console.log(`Portal: ${url}`);
  const cookie = await iniciarSesion(url, email, password);
  console.log('Sesión iniciada.\n');

  const fotos = fotosAImportar();
  const resultado: Record<string, MedioPublico> = {};
  let subidas = 0;
  let reutilizadas = 0;

  for (const foto of fotos) {
    const nombreOriginal = foto.archivo.split(/[\\/]/).pop()!;
    const existente = await buscarPorNombreOriginal(url, cookie, nombreOriginal);
    if (existente) {
      resultado[foto.clave] = existente;
      reutilizadas++;
      console.log(`= ${foto.clave} → ya existe (${existente.id})`);
      continue;
    }
    const medio = await subirFoto(url, cookie, foto);
    resultado[foto.clave] = medio;
    subidas++;
    console.log(`+ ${foto.clave} → subida (${medio.id})`);
  }

  const totalBytes = Object.values(resultado).length; // el peso real lo reporta /api/medios (espacioUsado)
  console.log(`\nTotal: ${fotos.length} fotos (${subidas} subidas, ${reutilizadas} reutilizadas).`);

  const salidaTs = `/**
 * GENERADO por scripts/importar-fotos.ts — no editar a mano.
 * Vuelve a correr el script (contra el portal real) si cambia alguna foto.
 */
export const MEDIOS_GENERADOS = ${JSON.stringify(resultado, null, 2)} as const;
`;
  const destino = join(import.meta.dirname, '../clientes/wellbusiness/src/medios-generados.ts');
  writeFileSync(destino, salidaTs);
  console.log(`\nEscrito: ${destino}`);

  if (cargar) {
    console.log('\n--cargar: llamando a POST /api/carga-inicial...');
    await cargarContenidoInicial(url, cookie);
    return;
  }

  if (subidas > 0) {
    console.log(
      '\nSiguiente paso: revisa y comitea medios-generados.ts, despliega el portal, y solo entonces ' +
        'vuelve a correr este script con --cargar (o usa el botón "Cargar" en /carga-inicial).',
    );
  } else {
    console.log(
      '\nNo se subió ninguna foto nueva (todas ya existían). Si el portal desplegado ya conoce estos ' +
        'ids, puedes correr este script otra vez con --cargar.',
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
