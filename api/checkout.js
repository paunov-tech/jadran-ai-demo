import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin === "https://jadran.ai" ? "https://jadran.ai" : req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { roomCode, guestName, lang, returnPath, plan, region, deviceId } = req.body || {};
    if (!plan || !["week", "season"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });
    const origin = "https://jadran.ai"; // Hardcoded — prevents open redirect via forged Origin header

    const plans = {
      week:   { name: "JADRAN Vodič — Tjedan (7 dana)", amount: 499, days: 7 },
      season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 999, days: 30 },
    };
    const p = plans[plan] || plans.week;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      // Collect email — enables Stripe auto-receipt
      customer_creation: "always",
      payment_intent_data: {
        receipt_email: undefined, // Will be set from customer email
      },
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: p.name,
            description: lang === "de" || lang === "at" ? "AI Reiseführer für die kroatische Küste" : lang === "en" ? "AI travel guide for Croatian coast" : lang === "it" ? "Guida AI per la costa croata" : "AI turistički vodič za hrvatsku obalu",
          },
          unit_amount: p.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      // Stripe Tax — automatic DDV calculation per buyer country
      automatic_tax: { enabled: true },
      // Auto-send Stripe receipt to customer email
      invoice_creation: { enabled: true },
      success_url: origin + (returnPath || "/ai") + `?payment=success&plan=${plan || "week"}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin + (returnPath || "/ai") + "?payment=cancelled",
      metadata: {
        roomCode: roomCode || "AI-STANDALONE",
        guestName: guestName || "Guest",
        plan: plan || "week",
        region: region || "all",
        days: String(p.days),
        deviceId: deviceId || "unknown",
        lang: lang || "hr",
      },
      locale: lang === "de" || lang === "at" ? "de" : lang === "en" ? "en" : lang === "it" ? "it" : lang === "hr" ? "hr" : "auto",
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
