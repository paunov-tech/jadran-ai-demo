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

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fireMetaCAPI(email, eventName, { ip, ua, fbp, fbc, eventId } = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const emHash = await sha256(email);

  const userData = {
    em: [emHash],
    ...(ip         ? { client_ip_address: ip } : {}),
    ...(ua         ? { client_user_agent: ua } : {}),
    ...(fbp        ? { fbp } : {}),
    ...(fbc        ? { fbc } : {}),
    ...(externalId ? { external_id: [await sha256(externalId)] } : {}),
  };

  await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || `lead_${Date.now()}`,
        user_data: userData,
        action_source: "website",
        event_source_url: "https://jadran.ai/ai",
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
    en_camper:  "Your Croatia camper van guide is ready 🚐",
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

  const { email, name = "", segmentId, variantId = "default", source = "organic", fingerprint = {}, vid = "", returning = false, fbp = "", fbc = "", eventId = "", externalId = "" } = req.body || {};
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const ua = req.headers["user-agent"] || "";

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
      ip: strV(ip),
      fp_ua: strV(fingerprint.ua || ""),
      fp_lang: strV(fingerprint.lang || ""),
      fp_tz: strV(fingerprint.tz || ""),
      fp_screen: strV(fingerprint.screen || ""),
      vid: strV(vid),
      returning: { booleanValue: !!returning },
      emailStep: intV(0),
      createdAt: strV(now),
      updatedAt: strV(now),
      unsubscribed: { booleanValue: false },
    });

    // Fire async side-effects (don't block response)
    Promise.all([
      fireMetaCAPI(email, "Lead", { ip, ua, fbp, fbc, eventId }),
      sendWelcomeEmail(email, name, segmentId),
    ]).catch(() => {});

    return res.status(200).json({ ok: true, leadId });
  } catch (e) {
    return res.status(500).json({ error: "db" });
  }
}
