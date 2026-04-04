// GET  /api/ab-control?segmentId=... — list all variants with stats
// POST /api/ab-control — create/update variant entry or manually kill
// Auth: X-Admin-Token header

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

function strV(s) { return { stringValue: String(s) }; }
function intV(n) { return { integerValue: String(n) }; }

function adminOk(req) {
  const token = req.headers["x-admin-token"] || "";
  const expected = Buffer.from(process.env.ADMIN_TOKEN || "", "base64").toString();
  return token === expected && token.length > 0;
}

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

async function querySegment(segmentId) {
  const r = await fetch(`${FS_QUERY}?key=${process.env.VITE_FB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "mkt_ab" }],
        where: {
          fieldFilter: { field: { fieldPath: "segmentId" }, op: "EQUAL", value: { stringValue: segmentId } },
        },
        orderBy: [{ field: { fieldPath: "impressions" }, direction: "DESCENDING" }],
        limit: 100,
      },
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return data.filter(d => d.document).map(d => {
    const f = d.document.fields;
    const imp = parseInt(f.impressions?.integerValue || "0");
    const conv = parseInt(f.conversions?.integerValue || "0");
    return {
      id: d.document.name.split("/").pop(),
      variantId: f.variantId?.stringValue,
      segmentId: f.segmentId?.stringValue,
      impressions: imp,
      conversions: conv,
      convRate: imp > 0 ? (conv / imp * 100).toFixed(2) + "%" : "—",
      killed: f.killed?.booleanValue || false,
      updatedAt: f.updatedAt?.stringValue,
    };
  });
}

export default async function handler(req, res) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
  };
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (!adminOk(req)) return res.status(401).json({ error: "unauthorized" });

  if (req.method === "GET") {
    const segmentId = req.query.segmentId;
    if (!segmentId) return res.status(400).json({ error: "segmentId required" });
    const variants = await querySegment(segmentId);
    return res.status(200).json({ ok: true, segmentId, variants });
  }

  if (req.method === "POST") {
    const { action, variantId, segmentId } = req.body || {};
    if (!variantId || !segmentId) return res.status(400).json({ error: "missing fields" });

    const docId = `${segmentId}__${variantId}`;

    if (action === "kill") {
      const existing = await fsGet("mkt_ab", docId);
      if (!existing) return res.status(404).json({ error: "not found" });
      await fsSet("mkt_ab", docId, {
        ...existing.fields,
        killed: { booleanValue: true },
        killedAt: strV(new Date().toISOString()),
      });
      return res.status(200).json({ ok: true, action: "killed", docId });
    }

    if (action === "revive") {
      const existing = await fsGet("mkt_ab", docId);
      if (!existing) return res.status(404).json({ error: "not found" });
      await fsSet("mkt_ab", docId, {
        ...existing.fields,
        killed: { booleanValue: false },
        killedAt: strV(""),
      });
      return res.status(200).json({ ok: true, action: "revived", docId });
    }

    if (action === "create") {
      await fsSet("mkt_ab", docId, {
        variantId: strV(variantId),
        segmentId: strV(segmentId),
        source: strV(req.body.source || "meta"),
        impressions: intV(0),
        conversions: intV(0),
        killed: { booleanValue: false },
        createdAt: strV(new Date().toISOString()),
        updatedAt: strV(new Date().toISOString()),
      });
      return res.status(200).json({ ok: true, action: "created", docId });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  return res.status(405).json({ error: "method" });
}
