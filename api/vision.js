// Vision API — Gemini 2.0 Flash multimodal
// Analyzes photos: menus, signs, ferry schedules, landscapes
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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

    const systemPrompt = `Ti si "Jadran Vision" — AI asistent koji analizira fotografije turista na jadranskoj obali.

JEZIK ODGOVORA: ${langName}

MOGUĆNOSTI:
1. JELOVNIK/MENI: Prevedi nazive jela, objasni što je svako jelo, preporuči najbolji izbor. Ako nešto nije sezonsko, upozori (npr. "Tartufi su vjerovatno iz konzerve jer nije sezona — uzmi radije šparoge").
2. NATPIS/TABLA: Prevedi tekst, objasni kontekst (npr. radno vrijeme, zabrane, upozorenja).
3. RED VOŽNJE (trajekt/bus): Prevedi, istakni sljedeći polazak, upozori na bitne detalje.
4. LOKACIJA/PEJZAŽ: Prepoznaj mjesto ako možeš, daj insider savjete.
5. CJENIK: Prevedi, usporedi s prosjekom (je li skupo ili ok za tu lokaciju).
6. PROIZVOD/HRANA: Identificiraj, objasni je li lokalni specijalitet, predloži gdje kupiti jeftinije.

PRAVILA:
- Budi konkretan i praktičan — cijene, udaljenosti, alternative
- Koristi emoji za čitljivost
- Ako prepoznaješ restoran/lokaciju, daj insider tip
- Završi s jednom korisnom preporukom
${context ? "KONTEKST: " + context : ""}`;

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
