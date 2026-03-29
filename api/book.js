import Stripe from "stripe";

// Rate limit: 20 booking attempts/hour per IP
const _rl = new Map();
function bookRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 20) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!bookRateOk(clientIp)) return res.status(429).json({ error: "Too many attempts. Try again later." });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { activityName, price, quantity, roomCode, guestName, lang } = req.body;
    const origin = req.headers.origin || "https://jadran-ai-demo.vercel.app";

    // Validate price: must be between €1.00 and €9,999.00
    const priceNum = Number(price);
    if (!priceNum || priceNum < 1 || priceNum > 9999) {
      return res.status(400).json({ error: "Invalid price" });
    }
    const qty = Math.max(1, Math.min(100, Math.round(Number(quantity) || 1)));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: activityName || "JADRAN AI Activity",
            description: `Booking via JADRAN AI Concierge · ${guestName || "Guest"}`,
          },
          unit_amount: Math.round(priceNum * 100),
        },
        quantity: qty,
      }],
      mode: "payment",
      success_url: `${origin}?booking=success&activity=${encodeURIComponent(activityName || "")}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?booking=cancelled`,
      metadata: {
        roomCode: roomCode || "DEMO",
        guestName: guestName || "Guest",
        activityName: activityName || "Unknown",
        product: "jadran_ai_booking",
        quantity: String(qty),
      },
      billing_address_collection: "auto",
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe booking error:", err);
    return res.status(500).json({ error: err.message });
  }
}
