// api/rab-card-scan.js — Partner/attraction card validation + scan logging
// GET  ?id={cardId}          → validate card (partner scans QR)
// POST { cardId, partnerId, partnerName, scanType }  → log scan + validate

const FB_KEY     = process.env.FIREBASE_API_KEY;
const FB_PROJECT = "molty-portal";
const CORS       = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

async function fsGet(col, id) {
  if (!FB_KEY) return null;
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`
  );
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(d.fields))
    out[k] = v.stringValue ?? v.integerValue ?? null;
  return out;
}

async function fsSet(col, id, data) {
  if (!FB_KEY) return;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    fields[k] = { stringValue: String(v) };
  }
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  ).catch(() => {});
}

function isExpired(expiresAt) {
  return expiresAt && new Date(expiresAt) < new Date();
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const cardId = req.method === "GET" ? req.query.id : req.body?.cardId;
  if (!cardId) return res.status(400).json({ error: "cardId required" });

  const card = await fsGet("jadran_rab_cards", cardId);
  if (!card) return res.status(404).json({ valid: false, error: "Kartica ne postoji" });

  const expired = isExpired(card.expiresAt);
  const valid   = !expired && card.status === "active";

  // POST: log the scan
  if (req.method === "POST" && valid) {
    const { partnerId = "", partnerName = "", scanType = "discount" } = req.body || {};
    await fsSet("jadran_rab_card_scans", `${cardId}-${Date.now()}`, {
      cardId, partnerId, partnerName, scanType,
      guestName: card.guestName, city: card.city,
      affiliateId: card.affiliateId || "",
      scannedAt: new Date().toISOString(),
    });
  }

  const msg = valid
    ? { hr: "✅ Kartica validna", en: "✅ Card valid", de: "✅ Karte gültig", it: "✅ Carta valida" }[card.lang || "hr"]
    : { hr: "❌ Kartica istekla", en: "❌ Card expired", de: "❌ Karte abgelaufen", it: "❌ Carta scaduta" }[card.lang || "hr"];

  return res.status(200).json({
    valid, cardId,
    guestName: card.guestName,
    city: card.city,
    expiresAt: card.expiresAt,
    affiliateId: card.affiliateId || "",
    message: msg,
  });
}
