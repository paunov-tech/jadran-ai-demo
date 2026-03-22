import Stripe from "stripe";

// Vercel config: disable body parsing for raw webhook body
export const config = { api: { bodyParser: false } };

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

async function sendPaymentAlert(email, plan, amount) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JADRAN AI <noreply@jadran.ai>",
        to: ["info@sialconsulting.com"],
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
    // Fire-and-forget payment alert email
    sendPaymentAlert(email, meta.plan || "week", session.amount_total).catch(() => {});
  }

  return res.status(200).json({ received: true });
}
