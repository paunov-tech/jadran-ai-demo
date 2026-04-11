// api/rab-card.js — Generate Rab Card digital pass
// POST { guestName, city?, lang?, affiliateId?, validDays? }
// → Firestore jadran_rab_cards + Google Wallet Generic Pass
// QR value = https://jadran.ai/?card={cardId} (scannable by any QR reader)

import { createSign, randomBytes } from "crypto";

const ISSUER_ID   = "3388000000023116190";
const CLASS_SUFFIX = "rab_card_v1";
const CLASS_ID    = `${ISSUER_ID}.${CLASS_SUFFIX}`;
const WALLET_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const FB_KEY      = process.env.FIREBASE_API_KEY;
const FB_PROJECT  = "molty-portal";
const CORS        = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];
const B32         = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function b64url(val) {
  return Buffer.from(typeof val === "string" ? val : JSON.stringify(val)).toString("base64url");
}

function genId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Array.from(randomBytes(4), b => B32[b % 32]).join("");
  return `RAB-${date}-${rand}`;
}

function getSA() {
  try { return JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT || ""); }
  catch { return null; }
}

async function getToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const hdr = b64url({ alg: "RS256", typ: "JWT" });
  const pay = b64url({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  });
  const sign = createSign("RSA-SHA256");
  sign.update(`${hdr}.${pay}`);
  const jwt = `${hdr}.${pay}.${sign.sign(sa.private_key, "base64url")}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  return (await r.json()).access_token;
}

async function ensureClass(token) {
  const r = await fetch(`${WALLET_BASE}/genericClass/${CLASS_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.ok) return; // already exists
  await fetch(`${WALLET_BASE}/genericClass`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: CLASS_ID }),
  });
}

function signWalletJwt(objectId, sa) {
  const hdr = b64url({ alg: "RS256", typ: "JWT" });
  const pay = b64url({
    iss: sa.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: ["https://jadran.ai"],
    payload: { genericObjects: [{ id: objectId }] },
  });
  const sign = createSign("RSA-SHA256");
  sign.update(`${hdr}.${pay}`);
  return `${hdr}.${pay}.${sign.sign(sa.private_key, "base64url")}`;
}

async function fsWrite(id, data) {
  if (!FB_KEY) return;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    fields[k] = typeof v === "number" ? { integerValue: String(v) } : { stringValue: String(v) };
  }
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_rab_cards/${id}?key=${FB_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  ).catch(() => {});
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { guestName, city = "Rab", lang = "hr", affiliateId = "", validDays = 14 } = req.body || {};
  if (!guestName?.trim()) return res.status(400).json({ error: "guestName required" });

  const cardId   = genId();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + Number(validDays) * 86400000).toISOString().slice(0, 10);
  const cardUrl  = `https://jadran.ai/?card=${cardId}`;

  let walletUrl = null;
  const sa = getSA();

  if (sa) {
    try {
      const token = await getToken(sa);
      await ensureClass(token);

      const objectId = `${ISSUER_ID}.${cardId}`;
      const L = ["hr","en","de","it"].includes(lang) ? lang : "hr";

      const validLabel    = { hr:`Do ${expiresAt}`, en:`Until ${expiresAt}`, de:`Bis ${expiresAt}`, it:`Fino al ${expiresAt}` }[L];
      const benefitLabel  = { hr:"Popusti · Atrakcije · Aktivnosti", en:"Discounts · Attractions · Activities", de:"Rabatte · Sehenswürdigkeiten", it:"Sconti · Attrazioni · Attività" }[L];
      const destLabel     = { hr:"Destinacija", en:"Destination", de:"Destination", it:"Destinazione" }[L];
      const validHdr      = { hr:"Vrijedi", en:"Valid", de:"Gültig", it:"Valido" }[L];
      const benefitHdr    = { hr:"Benefiti", en:"Benefits", de:"Vorteile", it:"Vantaggi" }[L];

      const obj = {
        id: objectId, classId: CLASS_ID, state: "ACTIVE",
        genericType: "GENERIC_TYPE_UNSPECIFIED",
        hexBackgroundColor: "#0a1628",
        logo: {
          sourceUri: { uri: "https://jadran.ai/icon-192.png" },
          contentDescription: { defaultValue: { language: "en", value: "JADRAN.ai" } },
        },
        cardTitle:  { defaultValue: { language: L, value: "Rab Card" } },
        subheader:  { defaultValue: { language: L, value: "JADRAN.ai Partner Kartica" } },
        header:     { defaultValue: { language: L, value: guestName.trim() } },
        barcode:    { type: "QR_CODE", value: cardUrl, alternateText: cardId },
        heroImage: {
          sourceUri: { uri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80" },
          contentDescription: { defaultValue: { language: "en", value: "Rab Island, Croatia" } },
        },
        textModulesData: [
          { id: "dest",    header: destLabel,   body: city },
          { id: "valid",   header: validHdr,    body: validLabel },
          { id: "benefit", header: benefitHdr,  body: benefitLabel },
        ],
      };

      const cr = await fetch(`${WALLET_BASE}/genericObject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(obj),
      });

      // 200 = created, 409 = already exists — both are fine
      if (cr.ok || cr.status === 409) {
        walletUrl = `https://pay.google.com/gp/v/save/${signWalletJwt(objectId, sa)}`;
      }
    } catch (e) {
      console.error("Wallet error:", e.message);
    }
  }

  await fsWrite(cardId, {
    cardId, guestName: guestName.trim(), city, lang, affiliateId,
    validDays: String(validDays), issuedAt, expiresAt, status: "active",
  });

  return res.status(200).json({ ok: true, cardId, walletUrl, cardUrl, guestName: guestName.trim(), expiresAt, city });
}
