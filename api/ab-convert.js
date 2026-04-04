// POST /api/ab-convert
// Record a lead conversion for a variant. Auto-kills losers if thresholds met.
// Body: { variantId, segmentId }

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const AB_MIN_IMPRESSIONS = 500;
const AB_MIN_CONV_RATE = 0.01; // 1%

async function fsGet(col, id) {
  const r = await fetch(`${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`);
  if (!r.ok) return null;
  return r.json();
}

async function fsSet(col, id, fields) {
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  );
  return r.ok;
}

async function fsQuery(col, filters = []) {
  const structuredQuery = {
    from: [{ collectionId: col }],
    where: filters.length === 1 ? {
      fieldFilter: { field: { fieldPath: filters[0].field }, op: filters[0].op, value: filters[0].value }
    } : {
      compositeFilter: { op: "AND", filters: filters.map(f => ({ fieldFilter: { field: { fieldPath: f.field }, op: f.op, value: f.value } })) }
    },
  };
  const r = await fetch(
    `${FS.replace("/documents", "")}:runQuery?key=${process.env.VITE_FB_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery }) }
  );
  if (!r.ok) return [];
  const data = await r.json();
  return data.filter(d => d.document).map(d => ({ id: d.document.name.split("/").pop(), ...d.document.fields }));
}

function intV(n) { return { integerValue: String(n) }; }
function strV(s) { return { stringValue: s }; }

export default async function handler(req, res) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const { variantId, segmentId } = req.body || {};
  if (!variantId || !segmentId) return res.status(400).json({ error: "missing fields" });

  const docId = `${segmentId}__${variantId}`;
  const col = "mkt_ab";

  try {
    const existing = await fsGet(col, docId);
    if (!existing) return res.status(404).json({ error: "variant not found" });

    const impressions = parseInt(existing.fields?.impressions?.integerValue || "0");
    const conversions = parseInt(existing.fields?.conversions?.integerValue || "0") + 1;

    await fsSet(col, docId, {
      ...existing.fields,
      conversions: intV(conversions),
      updatedAt: strV(new Date().toISOString()),
    });

    // Auto-kill check: after enough impressions, kill losers in this segment
    if (impressions >= AB_MIN_IMPRESSIONS && impressions % 100 === 0) {
      const allVariants = await fsQuery(col, [
        { field: "segmentId", op: "EQUAL", value: { stringValue: segmentId } },
        { field: "killed",    op: "EQUAL", value: { booleanValue: false } },
      ]);

      // Find best conv rate
      let best = 0;
      for (const v of allVariants) {
        const imp = parseInt(v.impressions?.integerValue || "0");
        const conv = parseInt(v.conversions?.integerValue || "0");
        if (imp >= AB_MIN_IMPRESSIONS) best = Math.max(best, conv / imp);
      }

      // Kill variants below threshold (only if there's a clear winner)
      if (best > AB_MIN_CONV_RATE) {
        for (const v of allVariants) {
          const imp = parseInt(v.impressions?.integerValue || "0");
          const conv = parseInt(v.conversions?.integerValue || "0");
          if (imp >= AB_MIN_IMPRESSIONS && conv / imp < AB_MIN_CONV_RATE) {
            await fsSet(col, v.id, { ...v, killed: { booleanValue: true }, killedAt: strV(new Date().toISOString()) });
          }
        }
      }
    }

    return res.status(200).json({ ok: true, conversions });
  } catch (e) {
    return res.status(500).json({ error: "db" });
  }
}
