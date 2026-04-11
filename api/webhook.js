import Stripe from "stripe";

// Vercel config: disable body parsing for raw webhook body
export const config = { api: { bodyParser: false } };

// Idempotency: track processed Stripe event IDs to prevent duplicate processing
// In-memory is sufficient — Stripe guarantees at-least-once delivery, not at-most-once;
// Firestore write itself is idempotent (same docId = upsert)
const _processedEvents = new Map();
function isAlreadyProcessed(eventId) {
  const now = Date.now();
  // Purge events older than 1 hour
  for (const [id, ts] of _processedEvents) { if (now - ts > 3600000) _processedEvents.delete(id); }
  if (_processedEvents.has(eventId)) return true;
  _processedEvents.set(eventId, now);
  return false;
}

// Firestore REST API write — zero dependencies, uses public API key
// NOTE: Intentional duplication — Vercel serverless cannot import sibling files
async function writePremium(deviceId, data) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jadran_premium/${deviceId}?key=${apiKey}`;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else if (typeof v === "string") fields[k] = { stringValue: v };
    else if (v instanceof Date) fields[k] = { timestampValue: v.toISOString() };
    else fields[k] = { stringValue: String(v) };
  }
  try {
    const resp = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
    if (!resp.ok) console.error("Firestore write failed:", resp.status, await resp.text());
    else console.log(`✅ Firebase: jadran_premium/${deviceId} written`);
  } catch (err) { console.error("Firestore write error:", err.message); }
}

// Meta Conversions API — server-side Purchase event
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fireMetaPurchase(email, plan, amount, { deviceId, sessionId } = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token || !email) return;

  const emHash = await sha256(email);
  const userData = {
    em: [emHash],
    ...(deviceId ? { external_id: [await sha256(deviceId)] } : {}),
  };

  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: sessionId ? `stripe_${sessionId}` : `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          user_data: userData,
          custom_data: {
            value: amount ? (amount / 100) : 0,
            currency: "EUR",
            content_name: plan || "week",
          },
          action_source: "website",
          event_source_url: "https://jadran.ai/ai",
        }],
      }),
    });
    if (r.ok) console.log(`✅ Meta CAPI Purchase fired for ${email}`);
    else console.warn(`⚠️ Meta CAPI Purchase failed: ${r.status}`);
  } catch (err) { console.error("Meta CAPI Purchase error:", err.message); }
}

async function sendPaymentAlert(email, plan, amount) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JADRAN AI <noreply@jadran.ai>",
        to: [process.env.REPORT_EMAIL || process.env.NOTIFY_EMAIL].filter(Boolean),
        subject: `Nova uplata — ${plan} (${amount ? (amount / 100).toFixed(2) : "?"}€)`,
        html: `<div style="font-family:system-ui,sans-serif;color:#1e293b;max-width:480px;">
          <h2 style="color:#0284c7;">💶 Nova uplata — JADRAN AI</h2>
          <p><strong>Email:</strong> ${email || "—"}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Iznos:</strong> ${amount ? (amount / 100).toFixed(2) : "?"} €</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Stripe webhook · jadran.ai</p>
        </div>`,
      }),
    });
  } catch (err) { console.error("sendPaymentAlert error:", err.message); }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Read raw body for signature verification
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  let event;
  try {
    if (!webhookSecret) return res.status(500).json({ error: "Webhook secret not configured" });
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  if (isAlreadyProcessed(event.id)) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata || {};
    const days = parseInt(meta.days || "7");
    console.log(`✅ Payment: ${meta.plan} for device ${meta.deviceId}`);

    // Send receipt email — Checkout doesn't auto-set receipt_email on PaymentIntent
    try {
      const email = session.customer_details?.email || session.customer_email;
      const piId = session.payment_intent;
      if (email && piId) {
        await stripe.paymentIntents.update(piId, { receipt_email: email });
        console.log(`📧 Receipt email set: ${email} on ${piId}`);
      }
    } catch (err) { console.error("Receipt email error:", err.message); }

    // Persist to Firestore for cross-device/cross-session recovery
    const email = session.customer_details?.email || session.customer_email || "";
    if (meta.deviceId && meta.deviceId !== "unknown") {
      await writePremium(meta.deviceId, {
        plan: meta.plan || "week",
        days,
        region: meta.region || "all",
        lang: meta.lang || "hr",
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + days * 86400000),
        sessionId: session.id,
        amount: session.amount_total,
        email,
        partnerRef: meta.partnerRef || "",
      });
    }
    // Fire-and-forget payment alert email + Meta CAPI Purchase
    sendPaymentAlert(email, meta.plan || "week", session.amount_total).catch(() => {});
    fireMetaPurchase(email, meta.plan || "week", session.amount_total, { deviceId: meta.deviceId, sessionId: session.id }).catch(() => {});
  }

  return res.status(200).json({ received: true });
}
