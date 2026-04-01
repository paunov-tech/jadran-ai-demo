// ── RATE LIMITER (IP + device-aware for Gemini cost control) ──
const _rl = new Map();
const _devRL = new Map();
const RL_MAX = 50, RL_WIN = 86400000; // 50 vision req/day per IP (tighter than chat)
const VISION_TIER_LIMITS = { free: 0, week: 0, season: 20, vip: 40, referral: 20 };

function rateOk(ip) {
  const now = Date.now();
  let cleaned = 0;
  for (const [k, v] of _rl) { if (now > v.r) { _rl.delete(k); if (++cleaned > 50) break; } }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + RL_WIN }); return true; }
  if (e.c >= RL_MAX) return false;
  e.c++; return true;
}

function visionTierOk(deviceId, plan) {
  if (!deviceId) return true;
  const limit = VISION_TIER_LIMITS[plan] || 0;
  if (limit === 0) return false; // Free/Explorer can't use vision (frontend-gated, backend safety)
  const now = Date.now();
  let cleaned = 0;
  for (const [k, v] of _devRL) { if (now > v.r) { _devRL.delete(k); if (++cleaned > 20) break; } }
  const e = _devRL.get(deviceId);
  if (!e || now > e.r) { _devRL.set(deviceId, { c: 1, r: now + RL_WIN }); return true; }
  if (e.c >= limit) return false;
  e.c++; return true;
}

// Vision API — Gemini 2.0 Flash multimodal
// Analyzes photos: menus, signs, ferry schedules, landscapes
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limit check
  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  if (!rateOk(clientIp)) {
    return res.status(429).json({ content: [{ type: "text", text: "Daily limit reached. Try again tomorrow or upgrade to Premium." }] });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Tier-aware vision limit — verify plan against Firestore, never trust frontend claim
  const { deviceId, plan: planClaim } = req.body || {};
  let verifiedPlan = "free";
  if (deviceId && planClaim && planClaim !== "free") {
    const FB_KEY = process.env.FIREBASE_API_KEY;
    if (FB_KEY) {
      try {
        const r = await fetch(`https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_premium/${deviceId}?key=${FB_KEY}`);
        if (r.ok) {
          const d = await r.json();
          if (d.fields?.plan?.stringValue) {
            const expiresAt = d.fields?.expiresAt?.timestampValue || d.fields?.expiresAt?.stringValue;
            const notExpired = !expiresAt || new Date(expiresAt) > new Date();
            if (notExpired) verifiedPlan = d.fields.plan.stringValue;
          }
        }
      } catch (_) { /* Firestore unavailable — stay free (fail-closed) */ }
    }
  }
  if (!visionTierOk(deviceId, verifiedPlan)) {
    return res.status(429).json({ text: "Jadran Lens daily limit reached. Vision uses are limited to protect service quality." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Service temporarily unavailable' });

  try {
    const { image, mimeType, lang, context } = req.body || {};
    if (!image || typeof image !== 'string') return res.status(400).json({ error: 'Image required' });
    if (image.length > 5000000) return res.status(413).json({ error: 'Image too large (max 5MB base64)' });
    // image = base64 string (no prefix), mimeType = "image/jpeg" etc.

    if (!image) return res.status(400).json({ error: 'No image provided' });

    const langMap = {
      hr: "Hrvatski", de: "Deutsch", at: "Österreichisches Deutsch (du-Form)", 
      en: "English", it: "Italiano", si: "Slovenščina", cz: "Čeština", pl: "Polski"
    };
    const langName = langMap[lang] || "Hrvatski";

    const userMsg = {
      hr: "Analiziraj ovu fotografiju i daj praktične informacije za turista.",
      de: "Analysiere dieses Foto und gib praktische Informationen für Touristen.",
      at: "Analysier dieses Foto und gib praktische Infos für Touristen.",
      en: "Analyze this photo and give practical information for a tourist.",
      it: "Analizza questa foto e dai informazioni pratiche per un turista.",
      si: "Analiziraj to fotografijo in podaj praktične informacije za turista.",
      cz: "Analyzuj tuto fotografii a poskytni praktické informace pro turistu.",
      pl: "Przeanalizuj to zdjęcie i podaj praktyczne informacje dla turysty.",
    };

    const systemPrompt = `You are "Jadran Lens" — an instant visual assistant for tourists on the Adriatic coast.

CRITICAL: Respond EXCLUSIVELY in ${langName}. Every word of your response must be in ${langName}.
CONTEXT: Tourist/${context || "on the Adriatic coast"}.

Identify what's in the image and give QUICK, actionable advice:
- PARKING SIGN: Can a camper/car park here? Cost? Hours?
- MENU: Translate dishes, recommend best value, warn if not seasonal
- RECEIPT: Is the price fair for this location? Warn about tourist markup.
- ROAD SIGN: Translate, explain restrictions (height, width, prohibition)
- TIMETABLE: Translate, highlight next departure, warn about details.
- BUILDING/LOCATION: Identify if possible, give insider tip.
- PRICE LIST: Translate, compare with average.
- PRODUCT/FOOD: Identify, is it a local specialty?

RULE: Respond in MAXIMUM 3-4 sentences. Be concrete — prices, alternatives, warnings. No introductions.
LANGUAGE RULE: Your ENTIRE response must be in ${langName}. Do NOT mix languages.`;

    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType || "image/jpeg", data: image } },
          { text: userMsg[lang] || userMsg.en }
        ]
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === "de" || lang === "at" ? "Konnte das Bild nicht analysieren. Bitte versuchen Sie es erneut." : lang === "en" ? "Could not analyze the image. Please try again." : lang === "it" ? "Non sono riuscito ad analizzare l'immagine. Riprova." : "Nisam uspio analizirati sliku. Pokušajte ponovno.");
    
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[VISION] Error:', err.message);
    return res.status(500).json({ error: err.message, text: "Image analysis error." });
  }
}
