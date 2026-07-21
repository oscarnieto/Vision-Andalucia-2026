# Páginas de sector (contenido en Word)

Cada archivo `.docx` de esta carpeta genera una página `/sector/<nombre>`
automáticamente al publicar.

## Cómo añadir o editar una página

1. Parte de la **plantilla** (`Plantilla-pagina-sector.docx`) y rellénala.
2. Guarda el Word **en esta carpeta** (`content/sectores/`). El nombre del
   archivo da igual; lo que manda es el campo **"Nombre de la página"** de
   dentro (ese es el enlace: `/sector/<nombre>`).
3. Sube el archivo al repositorio (puedes hacerlo desde la web de GitHub).
   Al hacer *commit*, la página se genera y se publica sola.

## Recursos que referencian los Word

- **Imágenes** → súbelas a `public/img/` (hero en `public/img/hero/`).
- **Mapas** → exporta el HTML de tu app a `public/mapas/` y referéncialo por
  su nombre de archivo en el bloque `[MAPA]`.

## Notas

- El conversor (`scripts/generar-sectores.mjs`) se ejecuta solo antes de cada
  build. No hay que tocar código para añadir páginas.
- Los párrafos en **cursiva** se tratan como comentarios y se ignoran: puedes
  dejar notas para ti en el Word sin que aparezcan en la web.
- El JSON generado (`src/data/sectores/*.json`) no se versiona: la fuente de
  verdad es el Word.
