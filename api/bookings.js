// api/bookings.js — Admin: list all bookings from Firestore
// GET /api/bookings — requires x-admin-token header

const FB_PROJECT  = "molty-portal";
const FB_KEY      = process.env.FIREBASE_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // No default — fail-closed if not configured

const CORS = {
  "Access-Control-Allow-Origin":  "https://jadran.ai",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!ADMIN_TOKEN) return res.status(503).json({ error: "Admin not configured" });
  const adminTok = req.headers["x-admin-token"];
  if (!adminTok || adminTok !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  if (!FB_KEY) return res.status(200).json({ bookings: [] });

  try {
    // Firebase REST structured query — list bookings ordered by createdAt desc
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "bookings" }],
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit: 200,
          },
        }),
      }
    );

    if (!r.ok) return res.status(200).json({ bookings: [] });

    const rows = await r.json();
    const bookings = rows
      .filter(row => row.document?.fields)
      .map(row => {
        const fields = row.document.fields;
        const out = {};
        for (const [k, v] of Object.entries(fields)) {
          out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
        }
        return out;
      });

    return res.json({ bookings });
  } catch (err) {
    console.error("bookings list error:", err.message);
    return res.status(500).json({ error: "Query failed" });
  }
}
