/**
 * Conversor Word → páginas de sector.
 *
 * Lee todos los .docx de content/sectores/ (rellenados con la plantilla) y
 * genera un archivo JSON por página en src/data/sectores/, que la plantilla
 * de Astro convierte en /sector/<slug>.
 *
 * Se ejecuta solo antes de cada build (npm run build → prebuild) y en local
 * con `npm run generar`. No hace falta escribir código para añadir páginas:
 * basta con dejar el Word en content/sectores/.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import mammoth from "mammoth";
import { parse } from "node-html-parser";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIR_WORD = path.join(ROOT, "content/sectores");
const DIR_OUT = path.join(ROOT, "src/data/sectores");
const DIR_MAPAS = path.join(ROOT, "public/mapas");

// ---------- utilidades ----------
const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const slugify = (s) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// convierte líneas "clave: valor" en un objeto
function kv(lines) {
  const o = {};
  for (const l of lines) {
    const m = l.match(/^([\wáéíóúñ ]+?):\s*(.*)$/i);
    if (m) o[norm(m[1])] = m[2].trim();
  }
  return o;
}
// elimina "(opcional)" y comillas sobrantes
const limpia = (s) => (s || "").replace(/\s*\(opcional\)\s*$/i, "").trim();
const sinComillas = (s) => (s || "").trim().replace(/^["“”']+|["“”']+$/g, "").trim();

// mapea la etiqueta [XXX] a un tipo de bloque
function tipoDeEtiqueta(label) {
  const n = norm(label).replace(/\s+/g, " ");
  if (n === "texto") return "texto";
  if (n === "titular") return "titular";
  if (n === "quote" || n === "cita") return "quote";
  if (n === "titular + imagen" || n === "titular imagen") return "titular-imagen";
  if (n === "imagen") return "imagen";
  if (n === "video") return "video";
  if (n === "grafica") return "chart";
  if (n === "graficas") return "chart-tabs";
  if (n === "mapa") return "mapa";
  if (n === "iframe") return "iframe";
  return null;
}

// extrae el id de Infogram de un texto tipo "infogram: 1a2b3c" o una URL
function infogramId(s) {
  if (!s) return "";
  const m = s.match(/infogram:\s*([\w-]+)/i) || s.match(/([\w-]{6,})\/?$/);
  return m ? m[1].trim() : s.trim();
}

// lee un mapa exportado (HTML con <script type="application/json">) y devuelve su JSON
async function leerMapa(archivo) {
  const file = path.join(DIR_MAPAS, archivo);
  if (!existsSync(file)) {
    console.warn(`  ⚠ mapa no encontrado: public/mapas/${archivo}`);
    return null;
  }
  const html = await readFile(file, "utf8");
  const m = html.match(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) {
    console.warn(`  ⚠ el mapa ${archivo} no contiene datos JSON`);
    return null;
  }
  try {
    return JSON.parse(m[1].trim());
  } catch {
    console.warn(`  ⚠ JSON del mapa ${archivo} no válido`);
    return null;
  }
}

// ---------- parseo de un documento ----------
async function parseDoc(html) {
  const root = parse(html);
  const nodos = root.childNodes.filter((n) => n.nodeType === 1); // solo elementos

  // 1) metadatos: primera tabla
  const datos = {};
  const tabla = nodos.find((n) => n.tagName === "TABLE");
  if (tabla) {
    for (const tr of tabla.querySelectorAll("tr")) {
      const celdas = tr.querySelectorAll("td, th");
      if (celdas.length < 2) continue;
      const campo = norm(celdas[0].text);
      // primer párrafo no vacío de la celda de valor
      const ps = celdas[1].querySelectorAll("p");
      const valor = (ps.length ? ps[0].text : celdas[1].text).trim();
      if (campo.startsWith("nombre")) datos.slug = valor;
      else if (campo.startsWith("titulo") || campo.startsWith("título")) datos.titulo = valor;
      else if (campo.startsWith("persona")) datos.autor = valor;
      else if (campo.startsWith("cargo")) datos.rol = valor;
      else if (campo.startsWith("imagen de fondo")) datos.image = valor;
      else if (campo.startsWith("badge")) datos.badge = valor;
    }
  }

  // 2) cuerpo: bloques entre el apartado "2." y el "3."
  let estado = "pre";
  const crudos = [];
  let actual = null;
  for (const n of nodos) {
    const t = n.text.trim();
    const nt = norm(t);
    if (/^h[1-6]$/i.test(n.tagName) || n.tagName === "P") {
      if (estado !== "body" && /^2\b/.test(nt) && nt.includes("contenido")) {
        estado = "body";
        continue;
      }
      if (estado === "body" && /^3\b/.test(nt)) {
        estado = "done";
        break;
      }
    }
    if (estado !== "body") continue;
    if (n.tagName !== "P") continue;

    // Los párrafos totalmente en cursiva son guía/comentarios: se ignoran.
    const em = n.querySelector("em, i");
    if (em && em.text.trim() === t) continue;

    const etiqueta = t.match(/^\[(.+?)\]$/);
    if (etiqueta) {
      actual = { tipo: tipoDeEtiqueta(etiqueta[1]), lines: [] };
      if (actual.tipo) crudos.push(actual);
      else actual = null;
    } else if (actual && t) {
      actual.lines.push(t);
    }
  }

  // 3) convierte cada bloque crudo al esquema final
  const bloques = [];
  let leadPuesto = false;
  for (const b of crudos) {
    if (b.tipo === "texto") {
      const parrafos = b.lines.filter(Boolean);
      if (!parrafos.length) continue;
      const bloque = { tipo: "texto", parrafos };
      if (!leadPuesto) {
        bloque.lead = true;
        leadPuesto = true;
      }
      bloques.push(bloque);
    } else if (b.tipo === "titular") {
      if (b.lines[0]) bloques.push({ tipo: "texto", titulo: b.lines[0] });
    } else if (b.tipo === "quote") {
      const [texto, autor] = (b.lines[0] || "").split("|");
      bloques.push({ tipo: "quote", texto: sinComillas(texto), ...(autor ? { autor: autor.trim() } : {}) });
    } else if (b.tipo === "titular-imagen") {
      const o = kv(b.lines);
      bloques.push({ tipo: "imagen", titulo: limpia(o.titular || o.titulo), imagen: rutaImg(o.imagen) });
    } else if (b.tipo === "imagen") {
      const o = kv(b.lines);
      bloques.push({ tipo: "imagen", imagen: rutaImg(o.imagen), ...(o.pie ? { pie: limpia(o.pie) } : {}) });
    } else if (b.tipo === "video") {
      const url = b.lines.find((l) => /https?:\/\//.test(l));
      if (url) bloques.push({ tipo: "video", youtube: url.trim() });
    } else if (b.tipo === "chart") {
      const o = kv(b.lines);
      const id = infogramId(o.infogram || b.lines[0]);
      bloques.push({ tipo: "chart", id, ...(o.titulo ? { titulo: limpia(o.titulo) } : {}) });
    } else if (b.tipo === "chart-tabs") {
      const graficas = b.lines
        .map((l) => {
          const [titulo, resto] = l.split("|");
          return { titulo: (titulo || "").trim(), id: infogramId(resto) };
        })
        .filter((g) => g.titulo || g.id);
      if (graficas.length) bloques.push({ tipo: "chart-tabs", graficas });
    } else if (b.tipo === "mapa") {
      const o = kv(b.lines);
      const data = o.archivo ? await leerMapa(o.archivo) : null;
      bloques.push({ tipo: "mapa", ...(o.titulo ? { titulo: limpia(o.titulo) } : {}), data });
    } else if (b.tipo === "iframe") {
      const o = kv(b.lines);
      bloques.push({
        tipo: "iframe",
        ...(o.titulo ? { titulo: limpia(o.titulo) } : {}),
        url: o.url,
        ...(o.alto ? { alto: parseInt(limpia(o.alto), 10) || undefined } : {}),
      });
    }
  }

  return { datos, bloques };
}

// nombre de imagen → ruta relativa a public/
function rutaImg(nombre) {
  const n = limpia(nombre);
  if (!n) return "";
  if (/^https?:\/\//.test(n) || n.includes("/")) return n;
  return `img/noticias/${n}`; // por defecto; el hero usa img/hero/ (ver datos.image)
}

// ---------- principal ----------
async function main() {
  if (!existsSync(DIR_WORD)) {
    console.log("No existe content/sectores/ — nada que convertir.");
    return;
  }
  await mkdir(DIR_OUT, { recursive: true });
  const files = (await readdir(DIR_WORD)).filter((f) => f.endsWith(".docx") && !f.startsWith("~$"));
  if (!files.length) {
    console.log("No hay .docx en content/sectores/ — nada que convertir.");
    return;
  }

  for (const f of files) {
    const buf = await readFile(path.join(DIR_WORD, f));
    const { value: htmlDoc } = await mammoth.convertToHtml({ buffer: buf });
    const { datos, bloques } = await parseDoc(htmlDoc);

    const slug = slugify(datos.slug || path.basename(f, ".docx"));
    if (!slug) {
      console.warn(`  ⚠ ${f}: falta "Nombre de la página" — se omite.`);
      continue;
    }
    // la imagen de fondo va a img/hero/
    const image = datos.image
      ? datos.image.includes("/")
        ? datos.image
        : `img/hero/${limpia(datos.image)}`
      : "";

    const sector = {
      slug,
      titulo: datos.titulo || slug,
      hero: {
        badge: limpia(datos.badge) || "",
        titulo: datos.titulo || "",
        autor: datos.autor || "",
        rol: datos.rol || "",
        image,
      },
      bloques,
    };

    await writeFile(path.join(DIR_OUT, `${slug}.json`), JSON.stringify(sector, null, 2) + "\n");
    console.log(`  ✓ ${f} → src/data/sectores/${slug}.json  (${bloques.length} bloques)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
