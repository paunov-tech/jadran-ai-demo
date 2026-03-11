// api/webhook.js — Stripe Webhook handler
// Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//
// In production, this writes to Firebase to persist premium status.
// For MVP, the verify.js endpoint is sufficient.
//
// Setup in Stripe Dashboard:
// 1. Go to Developers → Webhooks
// 2. Add endpoint: https://yourdomain.com/api/webhook
// 3. Select events: checkout.session.completed
// 4. Copy signing secret → STRIPE_WEBHOOK_SECRET env var

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      // Verify webhook signature in production
      const sig = req.headers['stripe-signature'];
      // Note: Vercel provides raw body at req.body when content-type is correct
      event = stripe.webhooks.constructEvent(
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
        sig,
        webhookSecret
      );
    } else {
      // Development mode — trust the payload
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const roomCode = session.metadata?.roomCode;
      const product = session.metadata?.product;

      console.log(`✅ Payment confirmed: ${product} for room ${roomCode}`);
      console.log(`   Amount: ${session.amount_total / 100} ${session.currency?.toUpperCase()}`);
      console.log(`   Customer: ${session.customer_email || session.metadata?.guestName}`);

      // TODO: Write to Firebase
      // await db.collection('rooms').doc(roomCode).update({ premium: true, paidAt: new Date() });

      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}

// Vercel config: disable body parsing for raw webhook body
export const config = {
  api: {
    bodyParser: false,
  },
};
