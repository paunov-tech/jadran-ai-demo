// api/viator-book.js — Viator activity booking via Stripe (10% markup)
// POST /api/viator-book  { productCode, title, price, date, persons, roomCode, guestName, lang }
// Saves pending booking to Firestore: bookings/{roomCode}_{bookingId}

import Stripe from "stripe";

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const MARKUP = 1.10; // 10% margin

async function saveBooking(roomCode, data) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;
  const docId = `${roomCode}_${Date.now()}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/bookings/${docId}?key=${apiKey}`;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else fields[k] = { stringValue: String(v) };
  }
  try {
    const resp = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!resp.ok) console.error("Firestore booking save failed:", resp.status);
  } catch (err) { console.error("Firestore booking error:", err.message); }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const { productCode, title, price, date, persons = 1, roomCode, guestName, lang } = req.body || {};
  if (!productCode || !title || !price) return res.status(400).json({ error: "productCode, title, price required" });

  const pricePerPerson = Math.round(Number(price) * MARKUP * 100); // cents, with markup
  const quantity = Math.max(1, Math.round(Number(persons)));
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const reqOrigin = req.headers.origin || "https://jadran.ai";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: title,
            description: `${date ? `Datum: ${date} · ` : ""}Osoba: ${quantity} · Booking via JADRAN AI`,
          },
          unit_amount: pricePerPerson,
        },
        quantity,
      }],
      mode: "payment",
      success_url: `${reqOrigin}?booking=success&activity=${encodeURIComponent(title)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${reqOrigin}?booking=cancelled`,
      metadata: {
        roomCode: roomCode || "DEMO",
        guestName: guestName || "Guest",
        productCode,
        activityName: title,
        date: date || "",
        persons: String(quantity),
        product: "jadran_viator_booking",
      },
      billing_address_collection: "auto",
    });

    // Save pending booking record to Firestore
    await saveBooking(roomCode || "DEMO", {
      productCode,
      title,
      date: date || "",
      persons: quantity,
      pricePerPerson: pricePerPerson / 100,
      total: (pricePerPerson * quantity) / 100,
      status: "pending_payment",
      sessionId: session.id,
      roomCode: roomCode || "DEMO",
      guestName: guestName || "Guest",
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Viator book error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
