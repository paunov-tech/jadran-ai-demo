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
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      paid: session.payment_status === "paid",
      roomCode: session.metadata?.roomCode || null,
      guestName: session.metadata?.guestName || null,
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("Stripe verify error:", err);
    return res.status(500).json({ error: err.message });
  }
}
