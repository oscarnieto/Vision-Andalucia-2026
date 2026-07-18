import { defineConfig } from 'astro/config';

// https://astro.build/config
//
// `site` y `base` están pensados para GitHub Pages (vista previa en vivo),
// donde el sitio vive en https://<usuario>.github.io/<repo>/.
// Cuando se publique en el servidor de la empresa (dominio propio, en la raíz),
// basta con poner base: '/' y ajustar `site` al dominio final.
export default defineConfig({
  site: 'https://oscarnieto.github.io',
  base: '/Vision-Andalucia-2026',
  trailingSlash: 'ignore',
});
