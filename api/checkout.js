import Stripe from "stripe";
// api/checkout.js — Creates Stripe Checkout Session for Premium
// Env var required: STRIPE_SECRET_KEY

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  import Stripe from 'stripe';
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const { roomCode, guestName, lang } = req.body;

    // Determine success/cancel URLs
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://jadran-ai-demo.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'JADRAN AI Premium',
            description: lang === 'de' || lang === 'at'
              ? 'AI-Concierge, Hidden Gems, personalisierte Empfehlungen — gesamter Aufenthalt'
              : lang === 'en'
              ? 'AI Concierge, Hidden Gems, personalized recommendations — entire stay'
              : lang === 'it'
              ? 'AI Concierge, Hidden Gems, consigli personalizzati — intero soggiorno'
              : 'AI Concierge, Hidden Gems, personalizirane preporuke — cijeli boravak',
            images: [], // Add product image URL later
          },
          unit_amount: 499, // 4.99 EUR in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}?payment=success&room=${roomCode || 'DEMO'}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?payment=cancelled`,
      metadata: {
        roomCode: roomCode || 'DEMO',
        guestName: guestName || 'Guest',
        product: 'jadran_ai_premium',
      },
      // Collect billing address for EU VAT compliance
      billing_address_collection: 'auto',
      // Auto tax calculation (optional, enable in Stripe Dashboard)
      // automatic_tax: { enabled: true },
    });

    return res.status(200).json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
