import Stripe from "stripe";

// Rate limit: 5 recovery attempts/hour per IP
const _rl = new Map();
function recoverRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 5) return false;
  e.c++; return true;
}

// Firestore REST write
async function writePremium(deviceId, data) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey || !deviceId) return false;
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
    return resp.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!recoverRateOk(clientIp)) return res.status(429).json({ error: "Too many attempts. Try again in 1 hour." });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Service unavailable" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { email, deviceId } = req.body;
    if (!email || !deviceId) return res.status(400).json({ error: "Email and deviceId required" });

    // Sanitize email
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: "Invalid email" });

    // Search Stripe for completed checkout sessions by customer email (paginate up to 100)
    let found = null;
    let startingAfter = undefined;
    for (let page = 0; page < 5 && !found; page++) {
      const params = { limit: 20, status: "complete" };
      if (startingAfter) params.starting_after = startingAfter;
      const sessions = await stripe.checkout.sessions.list(params);
      for (const s of sessions.data) {
        const sEmail = (s.customer_details?.email || s.customer_email || "").toLowerCase();
        if (sEmail === cleanEmail && s.payment_status === "paid") {
          const meta = s.metadata || {};
          if (meta.plan && ["week", "season", "vip"].includes(meta.plan)) {
            found = s;
            break;
          }
        }
      }
      if (!sessions.has_more) break;
      startingAfter = sessions.data[sessions.data.length - 1]?.id;
    }

    if (!found) return res.status(404).json({ error: "No JADRAN payment found for this email" });

    const meta = found.metadata || {};
    const days = parseInt(meta.days || "7");
    const paidAt = new Date(found.created * 1000);
    const expiresAt = new Date(paidAt.getTime() + days * 86400000);

    // Check if subscription is still valid
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: "Subscription expired", plan: meta.plan, expiredAt: expiresAt.toISOString() });
    }

    // Write premium to Firestore under NEW deviceId
    const written = await writePremium(deviceId, {
      plan: meta.plan,
      days,
      region: meta.region || "all",
      lang: meta.lang || "hr",
      paidAt,
      expiresAt,
      sessionId: found.id,
      amount: found.amount_total,
      email: cleanEmail,
      recoveredAt: new Date(),
      originalDeviceId: meta.deviceId || "unknown",
      partnerRef: meta.partnerRef || "",
    });

    if (!written) return res.status(500).json({ error: "Failed to restore subscription" });

    return res.status(200).json({
      recovered: true,
      plan: meta.plan,
      days,
      region: meta.region || "all",
      expiresAt: expiresAt.getTime(),
      paidAt: paidAt.toISOString(),
    });
  } catch (err) {
    console.error("Recovery error:", err);
    return res.status(500).json({ error: "Recovery failed" });
  }
}
