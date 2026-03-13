// ── RATE LIMITER (in-memory, per warm instance) ──
const _rl = new Map();
const RL_MAX = 100, RL_WIN = 86400000; // 100 req/day per IP
function rateOk(ip) {
  const now = Date.now();
  // Lazy cleanup: purge stale entries (max 50 per call)
  let cleaned = 0;
  for (const [k, v] of _rl) { if (now > v.r) { _rl.delete(k); if (++cleaned > 50) break; } }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + RL_WIN }); return true; }
  if (e.c >= RL_MAX) return false;
  e.c++; return true;
}

// Vision API — Gemini 2.0 Flash multimodal
// Analyzes photos: menus, signs, ferry schedules, landscapes
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limit check
  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  if (!rateOk(clientIp)) {
    return res.status(429).json({ content: [{ type: "text", text: "Dnevni limit dosegnut. Pokušajte sutra ili nadogradite na Premium." }] });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  try {
    const { image, mimeType, lang, context } = req.body;
    // image = base64 string (no prefix), mimeType = "image/jpeg" etc.

    if (!image) return res.status(400).json({ error: 'No image provided' });

    const langMap = {
      hr: "Hrvatski", de: "Deutsch", at: "Österreichisches Deutsch (du-Form)", 
      en: "English", it: "Italiano", si: "Slovenščina", cz: "Čeština", pl: "Polski"
    };
    const langName = langMap[lang] || "Hrvatski";

    const systemPrompt = `Ti si "Jadran Lens" — instant vizualni asistent za turiste na Jadranu.

JEZIK: ${langName}
KONTEKST: Turista/${context || "na jadranskoj obali"}.

PREPOZNAJ šta je na slici i daj BRZ, spasonosan savjet:
- PARKING TABLA: Smije li kamper/auto tu? Koliko košta? Radno vrijeme?
- JELOVNIK/MENI: Prevedi jela, preporuči best value, upozori ako nešto nije sezonsko ("Tartufi su vjerojatno iz konzerve — uzmi šparoge")
- RAČUN: Je li cijena fer za tu lokaciju? Upozori na turistički markup.
- SAOBRAĆAJNI ZNAK: Prevedi, objasni ograničenja (visina, širina, zabrana)
- RED VOŽNJE: Prevedi, istakni sljedeći polazak, upozori na detalje.
- ZGRADA/LOKACIJA: Prepoznaj ako možeš, daj insider tip.
- CJENIK: Prevedi, usporedi s prosjekom.
- PROIZVOD/HRANA: Identificiraj, je li lokalni specijalitet?

PRAVILO: Odgovori u MAKSIMALNO 3-4 rečenice. Budi konkretan — cijene, alternative, upozorenja. Bez uvoda.`;

    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType || "image/jpeg", data: image } },
          { text: "Analiziraj ovu fotografiju i daj praktične informacije za turista." }
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nisam uspio analizirati sliku. Pokušajte ponovno.";
    
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[VISION] Error:', err.message);
    return res.status(500).json({ error: err.message, text: "Greška pri analizi slike." });
  }
}
