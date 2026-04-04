// POST /api/ab-impression
// Track ad variant impression in Firestore.
// Body: { variantId, segmentId, source? }

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function fsGet(col, id) {
  const r = await fetch(`${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`);
  if (!r.ok) return null;
  return r.json();
}

async function fsSet(col, id, fields) {
  const body = { fields };
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  return r.ok;
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

  const { variantId, segmentId, source = "direct" } = req.body || {};
  if (!variantId || !segmentId) return res.status(400).json({ error: "missing fields" });

  const docId = `${segmentId}__${variantId}`;
  const col = "mkt_ab";

  try {
    const existing = await fsGet(col, docId);
    const impressions = existing?.fields?.impressions?.integerValue
      ? parseInt(existing.fields.impressions.integerValue) + 1 : 1;
    const conversions = existing?.fields?.conversions?.integerValue
      ? parseInt(existing.fields.conversions.integerValue) : 0;
    const killed = existing?.fields?.killed?.booleanValue || false;

    await fsSet(col, docId, {
      variantId: strV(variantId),
      segmentId: strV(segmentId),
      source: strV(source),
      impressions: intV(impressions),
      conversions: intV(conversions),
      killed: { booleanValue: killed },
      updatedAt: strV(new Date().toISOString()),
    });

    return res.status(200).json({ ok: true, impressions, conversions });
  } catch (e) {
    return res.status(500).json({ error: "db" });
  }
}
