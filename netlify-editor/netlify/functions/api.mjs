// Función serverless (Netlify) que guarda/lee las páginas en el repositorio de
// GitHub, protegida por una contraseña compartida. El token de GitHub y la
// contraseña viven SOLO aquí (variables de entorno de Netlify), nunca en el
// navegador.
//
// Variables de entorno necesarias en Netlify:
//   GITHUB_TOKEN     Token fino de GitHub con permiso Contents: Read and write
//                    sobre el repositorio.
//   EDITOR_PASSWORD  La contraseña que compartirás con tus compañeros.
//   GITHUB_REPO      "oscarnieto/Vision-Andalucia-2026"
//   GITHUB_BRANCH    "main"  (opcional, por defecto main)

const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const PASSWORD = process.env.EDITOR_PASSWORD;
const DIR = "src/data/sectores";

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

const gh = (path, opts = {}) =>
  fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "va2026-editor",
      ...(opts.headers || {}),
    },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!TOKEN || !PASSWORD || !REPO) return json({ error: "servidor sin configurar" }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  if (body.password !== PASSWORD) return json({ error: "unauthorized" }, 401);

  const slugOk = (s) => /^[a-z0-9-]+$/.test(s || "");

  try {
    if (body.action === "list") {
      const r = await gh(`contents/${DIR}?ref=${BRANCH}`);
      if (r.status === 404) return json({ pages: [] });
      if (!r.ok) return json({ error: "list failed" }, 500);
      const files = (await r.json()).filter((f) => f.name.endsWith(".json"));
      const pages = [];
      for (const f of files) {
        let titulo = f.name.replace(/\.json$/, "");
        try {
          const c = await (await fetch(f.download_url)).json();
          titulo = c.hero?.titulo || c.titulo || titulo;
        } catch {}
        pages.push({ slug: f.name.replace(/\.json$/, ""), titulo });
      }
      return json({ pages });
    }

    if (body.action === "get") {
      if (!slugOk(body.slug)) return json({ error: "slug" }, 400);
      const r = await gh(`contents/${DIR}/${body.slug}.json?ref=${BRANCH}`);
      if (!r.ok) return json({ error: "not found" }, 404);
      const f = await r.json();
      const page = JSON.parse(Buffer.from(f.content, "base64").toString("utf8"));
      return json({ page });
    }

    if (body.action === "save") {
      if (!slugOk(body.slug)) return json({ error: "slug inválido" }, 400);
      const path = `${DIR}/${body.slug}.json`;
      let sha;
      const ex = await gh(`contents/${path}?ref=${BRANCH}`);
      if (ex.ok) sha = (await ex.json()).sha;
      const content = Buffer.from(JSON.stringify(body.data, null, 2) + "\n", "utf8").toString("base64");
      const r = await gh(`contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Editor: ${sha ? "actualizar" : "crear"} ${body.slug}`,
          content, branch: BRANCH, sha,
        }),
      });
      if (!r.ok) return json({ error: "save failed", detail: await r.text() }, 500);
      return json({ ok: true });
    }

    if (body.action === "delete") {
      if (!slugOk(body.slug)) return json({ error: "slug" }, 400);
      const path = `${DIR}/${body.slug}.json`;
      const ex = await gh(`contents/${path}?ref=${BRANCH}`);
      if (!ex.ok) return json({ ok: true });
      const sha = (await ex.json()).sha;
      const r = await gh(`contents/${path}`, {
        method: "DELETE",
        body: JSON.stringify({ message: `Editor: borrar ${body.slug}`, sha, branch: BRANCH }),
      });
      return json({ ok: r.ok });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};
