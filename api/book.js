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
    const { activityName, price, quantity, roomCode, guestName, lang } = req.body;
    const origin = req.headers.origin || "https://jadran-ai-demo.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: activityName || "JADRAN AI Activity",
            description: `Booking via JADRAN AI Concierge · ${guestName || "Guest"}`,
          },
          unit_amount: Math.round((price || 0) * 100),
        },
        quantity: quantity || 1,
      }],
      mode: "payment",
      success_url: `${origin}?booking=success&activity=${encodeURIComponent(activityName || "")}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?booking=cancelled`,
      metadata: {
        roomCode: roomCode || "DEMO",
        guestName: guestName || "Guest",
        activityName: activityName || "Unknown",
        product: "jadran_ai_booking",
      },
      billing_address_collection: "auto",
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe booking error:", err);
    return res.status(500).json({ error: err.message });
  }
}
