/**
 * Compara visualmente dos versiones del sitio (por defecto: producción vs.
 * un sitio local levantado con `npm run dev:web`) — página completa, en
 * móvil y escritorio, e ignora animaciones/el marquee de logos igual que
 * los vería un usuario real.
 *
 * Se escribió para la verificación previa a la Fase 5 (comparar el sitio
 * ya migrado a D1 contra la producción vigente) y se deja en `scripts/`
 * porque es reutilizable para cualquier cambio visual futuro, no solo esa
 * verificación puntual.
 *
 * Cómo evita falsos positivos (dos problemas reales encontrados la primera
 * vez que se corrió esto, ver docs/ESTADO.md):
 * - `reducedMotion: 'reduce'` en el contexto de Playwright — el sitio ya
 *   respeta `prefers-reduced-motion` tanto para el marquee de logos
 *   (`motion-safe:` de Tailwind) como para el fade-in por scroll
 *   (`BaseLayout.astro` deja los elementos `[data-reveal]` visibles sin
 *   animar cuando el usuario prefiere menos movimiento) — no hace falta
 *   ninguna hoja de estilos adicional para "congelar" nada.
 * - Antes de la captura, hace scroll completo de la página y de regreso
 *   arriba: las imágenes `loading="lazy"` (p. ej. "Productos relacionados")
 *   nunca disparan su `IntersectionObserver` con una captura de página
 *   completa por CDP si la página nunca se scrolleó de verdad.
 * - `devToolbar: { enabled: false }` debe estar en el `astro.config.mjs` de
 *   cada app que se vaya a comparar en local — si no, la barra de Astro
 *   (solo visible en `astro dev`) sale en cada captura local y nunca en
 *   producción. Ya está puesto en `apps/web` y `apps/portal`.
 *
 * Uso:
 *   npx tsx scripts/capturas-visuales.ts \
 *     --local http://localhost:4321 \
 *     --prod https://idrocomsolutions.com \
 *     --out .capturas
 *
 *   --paginas "/,/nosotros"   (opcional; por defecto, las 8 páginas de contenido)
 *   --anchos "390,1440"       (opcional; por defecto, 390 y 1440)
 *
 * Requiere los navegadores de Playwright instalados una vez:
 *   npx playwright install chromium
 *
 * Si corres esto desde Git Bash (no PowerShell) y necesitas pasar
 * `--paginas` con rutas que empiezan en "/", antepón
 * `MSYS_NO_PATHCONV=1` — Git Bash en Windows reescribe por su cuenta un
 * argumento que empieza en "/" como si fuera una ruta de archivo
 * (confirmado en vivo: `--paginas "/"` se convertía en
 * "C:/Program Files/Git/"). El valor por defecto (sin pasar `--paginas`)
 * no tiene este problema porque nunca pasa por el shell.
 *
 * La carpeta de salida (`--out`, por defecto `.capturas/`) está en
 * `.gitignore` — las capturas y el reporte nunca se comitean, solo este
 * script.
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';

const PAGINAS_POR_DEFECTO = [
  '/',
  '/nosotros',
  '/cobertura',
  '/servicios',
  '/sectores',
  '/catalogo',
  '/catalogo/rva50',
  '/contacto',
];

interface Args {
  local: string;
  prod: string;
  out: string;
  paginas: string[];
  anchos: number[];
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string, fallback: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : fallback;
  };
  return {
    local: get('--local', 'http://localhost:4321'),
    prod: get('--prod', 'https://idrocomsolutions.com'),
    out: get('--out', '.capturas'),
    paginas: get('--paginas', PAGINAS_POR_DEFECTO.join(',')).split(','),
    anchos: get('--anchos', '390,1440').split(',').map(Number),
  };
}

const ALTO_VIEWPORT = 900; // el alto no importa para fullPage, solo el ancho.

const FREEZE_CSS = `*, *::before, *::after { transition-duration: 0.001s !important; scroll-behavior: auto !important; }`;

function slugify(pagina: string) {
  return pagina === '/' ? 'home' : pagina.replace(/\//g, '_').replace(/^_/, '');
}

async function capturar(browser: import('playwright').Browser, base: string, pagina: string, ancho: number, etiqueta: string, outDir: string) {
  const context = await browser.newContext({ viewport: { width: ancho, height: ALTO_VIEWPORT }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base + pagina, { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: FREEZE_CSS });
  // Scroll completo para disparar imágenes `loading="lazy"` antes de capturar.
  await page.evaluate(async () => {
    const paso = Math.max(200, Math.floor(window.innerHeight * 0.9));
    let y = 0;
    const max = document.documentElement.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
      y += paso;
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const archivo = path.join(outDir, `${etiqueta}__${slugify(pagina)}__${ancho}.png`);
  await page.screenshot({ path: archivo, fullPage: true });
  await context.close();
  return archivo;
}

async function main() {
  const { local, prod, out, paginas, anchos } = parseArgs();
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const reporte: Array<Record<string, unknown>> = [];

  for (const pagina of paginas) {
    for (const ancho of anchos) {
      const fila: Record<string, unknown> = { pagina, ancho };
      try {
        fila.prod = await capturar(browser, prod, pagina, ancho, 'prod', out);
      } catch (e) {
        fila.prodError = String((e as Error).message);
      }
      try {
        fila.local = await capturar(browser, local, pagina, ancho, 'local', out);
      } catch (e) {
        fila.localError = String((e as Error).message);
      }
      reporte.push(fila);
    }
  }
  await browser.close();

  console.log('\nComparando...\n');
  const resultados = reporte.map((fila) => {
    if (!fila.prod || !fila.local) {
      return { ...fila, estado: 'ERROR' };
    }
    const a = PNG.sync.read(fs.readFileSync(fila.prod as string));
    const b = PNG.sync.read(fs.readFileSync(fila.local as string));
    if (a.width !== b.width || a.height !== b.height) {
      return { ...fila, estado: 'TAMAÑO_DISTINTO', detalle: `${a.width}x${a.height} vs ${b.width}x${b.height}` };
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const nDiff = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.12, alpha: 0.3 });
    const total = a.width * a.height;
    const pct = (nDiff / total) * 100;
    let diffPath: string | undefined;
    if (nDiff > 0) {
      diffPath = path.join(out, `diff__${slugify(fila.pagina as string)}__${fila.ancho}.png`);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }
    return { ...fila, estado: pct > 0.05 ? 'DIFERENCIA' : 'OK', diffPixeles: nDiff, porcentaje: pct.toFixed(4), diffPath };
  });

  fs.writeFileSync(path.join(out, 'reporte.json'), JSON.stringify(resultados, null, 2));
  for (const r of resultados) {
    console.log(`${r.estado === 'OK' ? '✔' : '✗'}  ${r.pagina} @ ${r.ancho}px — ${r.estado}${r.porcentaje ? ` (${r.porcentaje}%)` : ''}`);
  }
  const hayProblemas = resultados.some((r) => r.estado !== 'OK');
  console.log(`\nReporte completo: ${path.join(out, 'reporte.json')}`);
  process.exit(hayProblemas ? 1 : 0);
}

main();
