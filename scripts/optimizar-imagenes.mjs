/**
 * Optimiza las imágenes PROPIAS del sitio (logos y collage del inicio; las fotos de productos y marcas
 * las sirve la plataforma con sus propios tamaños). Lee los PNG de `apps/web/imagenes-origen/**` y genera
 * en `apps/web/public/images/**`:
 *   <nombre>.webp           tamaño original
 *   <nombre>-<ancho>.webp   240 / 480 / 960 px de ancho, solo los más angostos que el original
 * más el manifiesto `apps/web/src/lib/imagenes-estaticas.json` que lee `lib/fotos.ts` (`atributosEstatica`)
 * para armar el `srcset`. webp con transparencia (calidad 90, alfa sin pérdida): los logos no cambian.
 *
 * Uso (desde la raíz del repo; los archivos generados SÍ se suben al repo):
 *   node scripts/optimizar-imagenes.mjs
 * Si agregas o cambias un PNG de `imagenes-origen/`, vuelve a correrlo.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ORIGEN = 'apps/web/imagenes-origen';
const DESTINO = 'apps/web/public/images';
const MANIFIESTO = 'apps/web/src/lib/imagenes-estaticas.json';
const ANCHOS = [240, 480, 960];
const OPCIONES = { quality: 90, alphaQuality: 100, effort: 6 };

function* pngs(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* pngs(p);
    else if (e.name.toLowerCase().endsWith('.png')) yield p;
  }
}

const manifiesto = {};
for (const archivo of [...pngs(ORIGEN)].sort()) {
  const rel = path.relative(ORIGEN, archivo).split(path.sep).join('/');
  const base = rel.replace(/\.png$/i, '');
  const salida = path.join(DESTINO, base);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  const { width, height } = await sharp(archivo).metadata();
  await sharp(archivo).webp(OPCIONES).toFile(`${salida}.webp`);
  const variantes = [];
  for (const ancho of ANCHOS.filter((a) => a < width)) {
    const info = await sharp(archivo).resize({ width: ancho }).webp(OPCIONES).toFile(`${salida}-${ancho}.webp`);
    variantes.push({ ancho: info.width, alto: info.height });
  }
  manifiesto[`/images/${base}`] = { ancho: width, alto: height, variantes };
  const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
  console.log(`${rel}: PNG ${kb(archivo)} KB → webp ${kb(`${salida}.webp`)} KB, variantes ${variantes.map((v) => v.ancho).join('/') || '—'}`);
}
fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + '\n');
console.log(`Manifiesto: ${MANIFIESTO}`);
