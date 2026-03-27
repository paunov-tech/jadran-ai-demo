// api/reserve.js — Pre-trip booking engine
// POST: create booking → unique JAD-XXX-YYYYMMDD-XXXXXX ID
// GET:  retrieve booking by ID
// Persists to Firebase Firestore (same REST pattern as chat.js)

import { randomBytes } from "crypto";

const FB_PROJECT = "molty-portal";
const FB_KEY     = process.env.FIREBASE_API_KEY;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Crockford base-32 charset (no 0/O/I/1 confusion)
const B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genBookingId(destId = "ADR") {
  const prefix = (destId || "ADR").slice(0, 3).toUpperCase();
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand   = Array.from(randomBytes(6), b => B32[b % 32]).join("");
  return `JAD-${prefix}-${date}-${rand}`;
}

async function fsWrite(id, data) {
  if (!FB_KEY) return false;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "number") fields[k] = { integerValue: String(v) };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else fields[k] = { stringValue: String(v) };
    }
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/bookings/${id}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok;
  } catch { return false; }
}

async function fsRead(id) {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/bookings/${id}?key=${FB_KEY}`
    );
    if (!r.ok) return null;
    const doc = await r.json();
    if (!doc.fields) return null;
    const out = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
    }
    return out;
  } catch { return null; }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET /api/reserve?id=JAD-... ──
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const booking = await fsRead(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    return res.json(booking);
  }

  // ── POST /api/reserve ──
  if (req.method === "POST") {
    const {
      destination, destinationName,
      accommodation,
      guestName, guestEmail,
      arrival, departure, guests,
      lang, deviceId,
    } = req.body || {};

    if (!destination || !guestName?.trim()) {
      return res.status(400).json({ error: "Required: destination, guestName" });
    }
    if (!arrival || !departure) {
      return res.status(400).json({ error: "Required: arrival, departure" });
    }

    const id = genBookingId(destination);
    const nights = Math.max(
      0,
      Math.round((new Date(departure) - new Date(arrival)) / 86400000)
    );

    const flat = {
      id,
      destination,
      destinationName: destinationName || destination,
      accommodationName: accommodation?.name || "",
      accommodationType: accommodation?.type || "affiliate",
      accommodationDirect: accommodation?.direct ? "true" : "false",
      guestName: guestName.trim(),
      guestEmail: (guestEmail || "").trim(),
      arrival,
      departure,
      nights,
      guests: guests || 2,
      lang: lang || "en",
      deviceId: deviceId || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Best-effort Firebase write (non-blocking for demo reliability)
    fsWrite(id, flat).catch(() => {});

    return res.json({ id, booking: flat });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
