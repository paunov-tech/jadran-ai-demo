import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { roomCode, guestName, lang, returnPath, plan, region } = req.body;
    const origin = req.headers.origin || "https://jadran-ai-demo.vercel.app";

    // Plan pricing: week (7 days, 1 region) or season (30 days, all regions)
    const plans = {
      week:   { name: "JADRAN Vodič — Tjedan (7 dana)", amount: 499, days: 7 },
      season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 999, days: 30 },
    };
    const p = plans[plan] || plans.week;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: p.name },
          unit_amount: p.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: origin + (returnPath || "") + `?payment=success&plan=${plan || "week"}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin + (returnPath || "") + "?payment=cancelled",
      metadata: {
        roomCode: roomCode || "AI-STANDALONE",
        guestName: guestName || "Guest",
        plan: plan || "week",
        region: region || "all",
        days: String(p.days),
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
