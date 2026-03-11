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
    const { roomCode, guestName, lang } = req.body;
    const origin = req.headers.origin || "https://jadran-ai-demo.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: "JADRAN AI Premium Concierge" },
          unit_amount: 599,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: origin + "?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "?payment=cancelled",
      metadata: { roomCode: roomCode || "DEMO", guestName: guestName || "Guest" },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
