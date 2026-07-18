/**
 * Resuelve la ruta de un asset teniendo en cuenta el `base` del sitio.
 *
 * En GitHub Pages el sitio vive en /Vision-Andalucia-2026/, así que las
 * imágenes de la carpeta `public/` deben referenciarse con ese prefijo.
 * En el servidor final (dominio propio en la raíz) el `base` será "/" y
 * esto seguirá funcionando sin cambios.
 *
 * En los datos (src/data/*.json) basta con escribir la ruta relativa a
 * `public/`, por ejemplo: "img/noticias/sevilla.jpg".
 * Las URLs absolutas (http/https) se devuelven tal cual.
 */
export function asset(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
