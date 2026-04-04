// POST /api/lead-capture
// Capture email lead: store in Firestore, fire Meta CAPI, trigger welcome email.
// Body: { email, name?, segmentId, variantId?, source? }

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

function strV(s) { return { stringValue: String(s) }; }
function intV(n) { return { integerValue: String(n) }; }

async function fsSet(col, id, fields) {
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  );
  return r.ok;
}

async function fireMetaCAPI(email, eventName) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  // Hash email for Meta
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(email.trim().toLowerCase()));
  const hashHex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");

  await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        user_data: { em: [hashHex] },
        action_source: "website",
      }],
    }),
  }).catch(() => {});
}

async function sendWelcomeEmail(email, name, segmentId) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const subjects = {
    de_camper:  "Dein Kroatien-Wohnmobil-Guide ist bereit 🚐",
    de_family:  "Dein Familien-Kroatien-Guide ist bereit 🏖️",
    it_sailor:  "La tua guida vela Croazia è pronta ⛵",
    en_cruiser: "Your Croatia sailing guide is ready ⚓",
    en_couple:  "Your secret Croatia guide is ready 🌊",
  };
  const subject = subjects[segmentId] || "Your JADRAN.AI guide is ready";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "JADRAN.AI <noreply@jadran.ai>",
      to: email,
      subject,
      html: `<p>Hi ${name || "there"},</p>
<p>Thanks for joining JADRAN.AI — your AI guide for Croatia's Adriatic coast.</p>
<p><a href="https://jadran.ai/ai">Start exploring now →</a></p>
<p style="color:#94a3b8;font-size:12px">You can unsubscribe at any time. SIAL Consulting d.o.o.</p>`,
    }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const { email, name = "", segmentId, variantId = "default", source = "organic" } = req.body || {};

  if (!email || !segmentId) return res.status(400).json({ error: "missing fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "invalid email" });

  const leadId = `${segmentId}_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const now = new Date().toISOString();

  try {
    // Store lead
    await fsSet("mkt_leads", leadId, {
      email: strV(email.toLowerCase()),
      name: strV(name),
      segmentId: strV(segmentId),
      variantId: strV(variantId),
      source: strV(source),
      emailStep: intV(0),
      createdAt: strV(now),
      updatedAt: strV(now),
      unsubscribed: { booleanValue: false },
    });

    // Fire async side-effects (don't block response)
    Promise.all([
      fireMetaCAPI(email, "Lead"),
      sendWelcomeEmail(email, name, segmentId),
    ]).catch(() => {});

    return res.status(200).json({ ok: true, leadId });
  } catch (e) {
    return res.status(500).json({ error: "db" });
  }
}
