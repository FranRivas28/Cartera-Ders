// Función de Vercel: precio en vivo (con ~15 min de demora de BYMA) e historia de 6 meses desde Yahoo.
// No necesita claves. Uso: /api/cotizacion?t=SPY,GOOGL  (sin sufijo se busca en BYMA: SPY -> SPY.BA)
const UA = { "User-Agent": "Mozilla/5.0 (cartera-ders)" };

async function serie(simbolo) {
  for (const host of ["query1", "query2"]) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?range=6mo&interval=1d`, { headers: UA });
      if (!r.ok) continue;
      const j = await r.json();
      const res = j?.chart?.result?.[0];
      if (!res) continue;
      const m = res.meta || {};
      const c = res.indicators?.quote?.[0]?.close || [];
      const historia = (res.timestamp || []).map((t, i) => [t, c[i]]).filter(([, v]) => v != null).map(([t, v]) => [t, +v.toFixed(2)]);
      const precio = m.regularMarketPrice ?? historia.at(-1)?.[1];
      // cierre anterior: el último cierre diario que no es el de hoy
      const hoy = new Date(((m.regularMarketTime || 0) + (m.gmtoffset || 0)) * 1000).toISOString().slice(0, 10);
      const previos = historia.filter(([t]) => new Date((t + (m.gmtoffset || 0)) * 1000).toISOString().slice(0, 10) < hoy);
      const anterior = previos.at(-1)?.[1] ?? m.chartPreviousClose;
      return { simbolo, moneda: m.currency, precio, anterior, hora: m.regularMarketTime, historia };
    } catch (e) { /* probar el otro host */ }
  }
  return null;
}

export default async function handler(req, res) {
  const pedidos = String(req.query.t || "").toUpperCase().split(",")
    .map(s => s.trim()).filter(s => /^[A-Z0-9.\-^=]{1,15}$/.test(s)).slice(0, 25);
  const out = {};
  await Promise.all(pedidos.map(async t => {
    const s = await serie(t.includes(".") || t.startsWith("^") ? t : `${t}.BA`);
    if (s) out[t] = s;
  }));
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  res.status(200).json(out);
}
