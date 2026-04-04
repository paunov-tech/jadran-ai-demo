// POST /api/campaign-generate
// Generate 50+ ad creative variants using Claude.
// Body: { segmentId, count?, tone? }
// Auth: X-Admin-Token header

const CLAUDE_MODEL = "claude-sonnet-4-6";
const DEFAULT_COUNT = 50;

export default async function handler(req, res) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
  };
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  // Admin auth
  const token = req.headers["x-admin-token"] || "";
  const expected = Buffer.from(process.env.ADMIN_TOKEN || "", "base64").toString();
  if (!token || token !== expected) return res.status(401).json({ error: "unauthorized" });

  const { segmentId, count = DEFAULT_COUNT, tone = "authentic" } = req.body || {};
  if (!segmentId) return res.status(400).json({ error: "segmentId required" });

  const SEGMENTS = {
    de_camper:  { lang: "German", pain: "Don't know where to legally park your motorhome in Croatia?", audience: "German camper van travellers", niche: "motorhome/camper travel" },
    de_family:  { lang: "German", pain: "Looking for safe, family-friendly beaches in Croatia?", audience: "German families with children", niche: "family beach holiday" },
    it_sailor:  { lang: "Italian", pain: "Don't know where to moor in Croatia?", audience: "Italian sailors and boaters", niche: "sailing the Adriatic" },
    en_cruiser: { lang: "English", pain: "Overwhelmed planning a Croatia sailing trip?", audience: "English-speaking cruisers and sailors", niche: "Adriatic sailing and cruising" },
    en_couple:  { lang: "English", pain: "Tired of overcrowded tourist beaches?", audience: "English-speaking couples seeking adventure", niche: "hidden beaches and romantic travel" },
  };

  const seg = SEGMENTS[segmentId];
  if (!seg) return res.status(400).json({ error: "unknown segmentId" });

  const prompt = `You are an expert performance marketing copywriter. Generate exactly ${count} ad creative variants for a Meta/Facebook campaign.

Product: JADRAN.AI — an AI travel guide for Croatia's Adriatic coast
Segment: ${seg.audience}
Niche: ${seg.niche}
Language: ${seg.lang}
Core pain: ${seg.pain}
Tone: ${tone} (never exaggerated, never fake — think helpful local friend)

Each variant should test a different angle:
- Pain-first hooks (questions, negatives)
- Benefit-first hooks (transformation, outcome)
- Social proof hooks (travellers like them)
- Curiosity hooks (secrets, locals-only)
- Urgency hooks (season, crowd avoidance)
- Emoji-led attention grabbers
- Story-format (one-line mini story)

Output ONLY a valid JSON array. No markdown, no explanation. Each object:
{
  "id": "v${segmentId.slice(0,3).toUpperCase()}_001",
  "hook": "3-8 word attention hook (first line of ad)",
  "body": "20-50 word ad body in ${seg.lang}",
  "cta": "button text (max 4 words)",
  "angle": "pain|benefit|social|curiosity|urgency|emoji|story",
  "headline": "optional landing page headline matching this angle"
}

Generate ${count} variants now.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: "claude", detail: err.slice(0, 200) });
    }

    const data = await r.json();
    const raw = data.content?.[0]?.text || "[]";

    // Parse JSON — Claude sometimes wraps in code block
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    let variants;
    try {
      variants = JSON.parse(jsonStr);
    } catch {
      return res.status(502).json({ error: "parse", raw: raw.slice(0, 500) });
    }

    return res.status(200).json({ ok: true, segmentId, count: variants.length, variants });
  } catch (e) {
    return res.status(500).json({ error: "internal", message: e.message });
  }
}
