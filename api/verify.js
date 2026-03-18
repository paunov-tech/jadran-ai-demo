import Stripe from "stripe";

// Firestore REST write — backup persistence (same as webhook.js)
// NOTE: Intentional duplication — Vercel serverless cannot import sibling files
async function writePremium(deviceId, data) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey || !deviceId || deviceId === "unknown") return;
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
    else console.log(`✅ verify.js: jadran_premium/${deviceId} written`);
  } catch (err) { console.error("Firestore write error:", err.message); }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { sessionId, deviceId: clientDeviceId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const meta = session.metadata || {};

    // Backup Firestore write — covers case where webhook didn't fire
    if (paid) {
      const did = clientDeviceId || meta.deviceId;
      const days = parseInt(meta.days || "7");
      if (did && did !== "unknown") {
        writePremium(did, {
          plan: meta.plan || "week",
          days,
          region: meta.region || "all",
          lang: meta.lang || "hr",
          paidAt: new Date(),
          expiresAt: new Date(Date.now() + days * 86400000),
          sessionId: session.id,
          amount: session.amount_total,
          email: session.customer_details?.email || "",
          partnerRef: meta.partnerRef || "",
        }).catch(() => {}); // fire-and-forget — don't block response
      }
    }

    return res.status(200).json({
      paid,
      roomCode: meta.roomCode || null,
      guestName: meta.guestName || null,
      amount: session.amount_total,
      currency: session.currency,
      plan: meta.plan || "week",
      days: meta.days || "7",
      region: meta.region || "all",
    });
  } catch (err) {
    console.error("Stripe verify error:", err);
    return res.status(500).json({ error: err.message });
  }
}
