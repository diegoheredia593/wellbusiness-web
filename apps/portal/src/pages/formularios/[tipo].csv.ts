/** GET /formularios/:tipo.csv → descarga los envíos de un formulario. */
import type { APIRoute } from 'astro';
import { csv } from '@/lib/servidor/envios';

export const GET: APIRoute = async ({ params }) => {
  const tipo = params.tipo ?? '';
  const contenido = await csv(tipo);
  if (contenido === null) return new Response('No encontrado', { status: 404 });
  const hoy = new Date().toISOString().slice(0, 10);
  return new Response(contenido, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="formulario-${tipo}-${hoy}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
