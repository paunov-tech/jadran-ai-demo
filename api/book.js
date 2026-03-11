// api/book.js — Stripe Checkout for activity bookings (concierge margin model)
// Guest pays ourPrice, we book at operator's price, keep the margin
// Env var required: STRIPE_SECRET_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const { activityName, price, quantity, roomCode, guestName, lang } = req.body;

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://jadran-ai-demo.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: activityName || 'JADRAN AI Activity',
            description: `Booking via JADRAN AI Concierge · ${guestName || 'Guest'}`,
          },
          unit_amount: Math.round((price || 0) * 100), // Convert EUR to cents
        },
        quantity: quantity || 1,
      }],
      mode: 'payment',
      success_url: `${origin}?booking=success&activity=${encodeURIComponent(activityName || '')}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?booking=cancelled`,
      metadata: {
        roomCode: roomCode || 'DEMO',
        guestName: guestName || 'Guest',
        activityName: activityName || 'Unknown',
        product: 'jadran_ai_booking',
      },
      billing_address_collection: 'auto',
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error('Stripe booking error:', err);
    return res.status(500).json({ error: err.message });
  }
}
