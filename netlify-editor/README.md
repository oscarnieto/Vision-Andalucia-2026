# Editor online (colaborativo) · Netlify

Editor de páginas de sector, **online y compartido**, protegido por contraseña.
No forma parte de la web pública ni se sube al servidor de la empresa: vive solo
en Netlify como espacio de trabajo del equipo.

- `index.html` — el editor (con pantalla de contraseña).
- `netlify/functions/api.mjs` — función que guarda/lee las páginas en el
  repositorio de GitHub (guarda el token de GitHub y la contraseña de forma
  segura, nunca en el navegador).

## Cómo se despliega en Netlify (una sola vez)

1. **Crea un token de GitHub** (fino, "Fine-grained"):
   - GitHub → *Settings → Developer settings → Personal access tokens →
     Fine-grained tokens → Generate new token*.
   - *Repository access*: solo el repo `oscarnieto/Vision-Andalucia-2026`.
   - *Permissions → Repository permissions → Contents: Read and write*.
   - Copia el token (empieza por `github_pat_…`).

2. **Crea el sitio en Netlify**:
   - Netlify → *Add new site → Import an existing project → GitHub* → elige el
     repositorio `Vision-Andalucia-2026`.
   - En la configuración de build pon **Base directory: `netlify-editor`**
     (deja "Build command" vacío y "Publish directory" en `netlify-editor`).

3. **Configura las variables de entorno** (Netlify → *Site settings →
   Environment variables*):
   - `GITHUB_TOKEN`   → el token del paso 1.
   - `EDITOR_PASSWORD`→ la contraseña que compartirás con tus compañeros.
   - `GITHUB_REPO`    → `oscarnieto/Vision-Andalucia-2026`.
   - `GITHUB_BRANCH`  → `main`.

4. **Despliega** (Netlify lo hace solo). Te dará una URL tipo
   `https://tu-sitio.netlify.app`.

## Uso

- Comparte con tu equipo la **URL de Netlify** y la **contraseña**.
- Cada uno entra, ve la **biblioteca de páginas del equipo**, crea o edita, y
  pulsa **"Guardar y publicar"**: la página se guarda en el repositorio y la web
  se actualiza en 1-2 min.
- El botón **"Descargar"** sigue disponible para bajar el `.json` si hiciera
  falta.

## Notas

- Las **imágenes** y los **mapas** se referencian por su nombre de archivo; hay
  que subirlos al repositorio (`public/img/…`, `public/mapas/…`) como hasta ahora.
- La contraseña y el token viven en Netlify (variables de entorno), nunca en el
  navegador de los usuarios.
