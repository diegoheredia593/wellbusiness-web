/* eslint-disable */
// Generado con `wrangler types --include-runtime=false` y editado a mano en el Sprint 4e (sin DB/MEDIOS; con PLATAFORMA y PLATAFORMA_LLAVE).
interface __BaseEnv_Env {
	PLATAFORMA: Fetcher /* agencia-plataforma */;
	ASSETS: Fetcher;
	/** Secreto del Worker (`.dev.vars` en local): llave de la plataforma, alcances contenido:leer + formularios:enviar. */
	PLATAFORMA_LLAVE: string;
}
declare namespace Cloudflare {
	interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
