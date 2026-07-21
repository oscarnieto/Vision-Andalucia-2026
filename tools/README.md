# Editor de páginas (herramienta local)

`editor.html` es una herramienta **local** para crear y editar las páginas de
sector con un formulario y vista previa en vivo. **No forma parte de la web**:
no se incluye en el build ni se sube al servidor.

## Cómo se usa

1. Abre `tools/editor.html` en tu navegador (doble clic — funciona sin internet).
2. Rellena los **datos** (título, persona, imagen de fondo…) y añade **bloques**
   con los botones "+": texto, titular, cita, imagen, vídeo, gráfica, gráficas
   con pestañas, mapa e iframe. Reordénalos y edítalos; ves el resultado en vivo.
3. Pulsa **"Descargar página"**: obtienes un archivo `<nombre>.json`.
4. Sube ese archivo a **`src/data/sectores/`** del repositorio (igual que subes
   las imágenes). Al hacer commit, la página se publica en `/sector/<nombre>`.

## Recursos que referencia

- **Imágenes** → súbelas a `public/img/` (hero en `public/img/hero/`). En el
  editor solo pones el nombre del archivo.
- **Gráficas** → pega el embed de Infogram (o su id); el editor extrae el id.
- **Mapas** → pega en el bloque *Mapa* el contenido del HTML que exporta tu app;
  el editor guarda los datos dentro de la página.

## Editar una página existente

Pulsa **"Cargar…"** y elige el `.json` de la página (de `src/data/sectores/`);
podrás modificarlo y volver a descargarlo.
