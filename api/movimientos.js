// Función de Vercel: lee y guarda los movimientos en data/cartera.json del repo de GitHub.
// Variables en Vercel: GITHUB_TOKEN (token con permiso de escritura en "Contents" del repo).
// Opcionales: GITHUB_REPO (por defecto FranRivas28/Cartera-Ders), GITHUB_BRANCH (main), CLAVE (si está, se pide para guardar).
const REPO = process.env.GITHUB_REPO || "FranRivas28/Cartera-Ders";
const RAMA = process.env.GITHUB_BRANCH || "main";
const RUTA = "data/cartera.json";
const API = `https://api.github.com/repos/${REPO}/contents/${RUTA}`;

const gh = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json",
    "User-Agent": "cartera-ders", "X-GitHub-Api-Version": "2022-11-28", ...(opts.headers || {}) },
});

function valido(d) {
  return d && typeof d === "object" && Array.isArray(d.movs) && d.movs.length < 5000 &&
    d.movs.every((m) => m && typeof m.activo === "string" && (m.tipo === "compra" || m.tipo === "venta") && /^\d{4}-\d{2}-\d{2}$/.test(m.fecha));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.GITHUB_TOKEN) return res.status(501).json({ error: "Vercel no ve la variable GITHUB_TOKEN en este deploy. Revisá que esté marcada para Production y hacé Redeploy." });

  if (req.method === "GET") {
    const r = await gh(`${API}?ref=${RAMA}`);
    if (r.status === 401) return res.status(502).json({ error: "GitHub no acepta el token (GITHUB_TOKEN): puede estar mal copiado o vencido." });
    if (r.status === 404) {
      const repo = await gh(`https://api.github.com/repos/${REPO}`);
      if (!repo.ok) return res.status(502).json({ error: `El token no tiene acceso al repo ${REPO}. Al crearlo, elegí ese repo en "Repository access".` });
      return res.status(200).json({ datos: { version: 1, movs: [], manual: {} }, sha: null, clave: !!process.env.CLAVE });
    }
    if (!r.ok) return res.status(502).json({ error: `GitHub respondió ${r.status}` });
    const j = await r.json();
    const datos = JSON.parse(Buffer.from(j.content, "base64").toString("utf8"));
    return res.status(200).json({ datos, sha: j.sha, clave: !!process.env.CLAVE });
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body) return res.status(400).json({ error: "Pedido vacío" });
    if (process.env.CLAVE && body.clave !== process.env.CLAVE) return res.status(401).json({ error: "Clave incorrecta" });
    if (!valido(body.datos)) return res.status(400).json({ error: "Datos con formato inválido" });
    const contenido = Buffer.from(JSON.stringify(body.datos, null, 1) + "\n", "utf8").toString("base64");
    const r = await gh(API, { method: "PUT", body: JSON.stringify({
      message: body.mensaje ? `Cartera: ${String(body.mensaje).slice(0, 120)}` : "Cartera: actualización desde la terminal",
      content: contenido, branch: RAMA, ...(body.sha ? { sha: body.sha } : {}),
    }) });
    if (r.status === 409 || r.status === 422) return res.status(409).json({ error: "Alguien guardó antes. Recargá y volvé a intentar." });
    if (r.status === 403 || r.status === 404) return res.status(502).json({ error: "El token puede leer pero no escribir: dale permiso Contents: Read and write." });
    if (!r.ok) return res.status(502).json({ error: `GitHub respondió ${r.status}` });
    const j = await r.json();
    return res.status(200).json({ sha: j.content.sha });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método no permitido" });
}
