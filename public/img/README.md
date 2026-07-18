# Imágenes del sitio

Suelta aquí las imágenes exportadas desde Figma. Se sirven tal cual (Astro no
las procesa), así que **usa el formato y tamaño ya optimizados** que quieras
publicar.

## Estructura

```
public/img/
├── hero/        → imágenes de fondo del hero (a pantalla completa)
├── noticias/    → imágenes de las tarjetas de noticias
└── video/       → miniatura/póster del vídeo del bloque "intro"
```

## Cómo referenciarlas

En `src/data/inicio.json`, en el campo `image` correspondiente, escribe la
ruta **relativa a `public/`** (sin barra inicial). Ejemplos:

```json
"hero":   { "image": "img/hero/portada.jpg", "alt": "Vista de Andalucía" }

"noticias": [
  { "size": "wide", "image": "img/noticias/sevilla.jpg", "title": "…" }
]

"intro": {
  "video": { "image": "img/video/poster.jpg", "url": "https://…", "alt": "…" }
}
```

El sitio resuelve automáticamente el prefijo del dominio/subcarpeta
(GitHub Pages o servidor final), no hay que añadirlo a mano.

## Recomendaciones

- **Formato:** JPG para fotos, PNG para logos/transparencias, SVG para iconos.
- **Peso:** comprime antes de subir (idealmente < 300 KB por foto).
- **Tamaño del hero:** ~2000 px de ancho es suficiente para pantallas grandes.
- **Tarjetas:** las cuadradas ~720×720 px; las anchas ~1500×720 px.
- **Nombres:** en minúsculas, sin espacios ni acentos (usa guiones):
  `nueva-sede-malaga.jpg`, no `Nueva Sede Málaga.jpg`.
