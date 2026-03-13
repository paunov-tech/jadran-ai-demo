import Stripe from "stripe";

// Vercel config: disable body parsing for raw webhook body
export const config = { api: { bodyParser: false } };

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
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata || {};
    console.log(`✅ Payment: ${meta.plan} for device ${meta.deviceId}, email: ${session.customer_details?.email}`);
    
    // TODO: Write to Firebase for cross-device persistence
    // const { initializeApp } = await import("firebase-admin/app");
    // const { getFirestore } = await import("firebase-admin/firestore");
    // await db.collection("premium").doc(meta.deviceId).set({
    //   plan: meta.plan, days: meta.days, region: meta.region,
    //   email: session.customer_details?.email,
    //   paidAt: new Date(), expiresAt: new Date(Date.now() + meta.days * 86400000),
    //   sessionId: session.id, amount: session.amount_total,
    // });
  }

  return res.status(200).json({ received: true });
}
