export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  try {
    const { prompt, mode } = req.body;

    const INSTRUCTIONS = {
      weather: 'Return ONLY a JSON object with fields: temp (number), feelsLike (number), icon (weather emoji), uv (number), wind (string), humidity (number), sea (sea water temp number), sunset (HH:MM string), description (string). Use real current data. NO markdown, NO backticks, NO explanation — raw JSON only.',
      forecast: 'Return ONLY a JSON array of exactly 7 objects for 7-day forecast starting today. Each: {"di":INDEX,"icon":"EMOJI","h":HIGH_TEMP,"l":LOW_TEMP}. Temperatures are Celsius integers. Use real forecast data. NO markdown, NO backticks — raw JSON array only.',
      places: 'Return ONLY a JSON array. Each object: {"name":"STRING","type":"STRING","distance":"STRING","rating":NUMBER,"priceRange":"STRING","openNow":BOOLEAN,"note":"STRING"}. Max 5. Use real data. NO markdown.',
      practical: 'Return ONLY a JSON array of 5-8 objects. Each MUST be: {"name":"STRING","note":"STRING with hours prices distances current status","warn":false}. warn=true ONLY for emergency numbers. Use REAL current data. NO markdown, NO backticks, NO explanation — output starts with [ ends with ].',
      grounded: 'You are a real-time information assistant for Croatian Adriatic coast tourists. Be concise. Include hours, prices, practical details.',
    };

    const sys = INSTRUCTIONS[mode] || INSTRUCTIONS.grounded;
    const jsonModes = ['weather', 'forecast', 'places', 'practical'];
    const isJson = jsonModes.includes(mode);

    const userPrompt = isJson
      ? prompt + '\n\nIMPORTANT: Respond with RAW JSON only. No markdown, no code blocks, no text before or after.'
      : prompt;

    const body = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: sys }] },
      generationConfig: {
        temperature: isJson ? 0.05 : 0.7,
        maxOutputTokens: isJson ? 800 : 1024,
      },
    };

    // Google Search grounding for real-time data
    body.tools = [{ googleSearch: {} }];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    let text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .filter(Boolean)
      .join('') || '';

    // Robust JSON extraction
    if (isJson && text) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      // Find JSON boundaries
      if (!text.startsWith('{') && !text.startsWith('[')) {
        const objIdx = text.indexOf('{');
        const arrIdx = text.indexOf('[');
        const start = objIdx === -1 ? arrIdx : arrIdx === -1 ? objIdx : Math.min(objIdx, arrIdx);
        if (start >= 0) {
          const isArr = text[start] === '[';
          const end = isArr ? text.lastIndexOf(']') : text.lastIndexOf('}');
          if (end > start) text = text.substring(start, end + 1);
        }
      }
      // Fix trailing commas
      text = text.replace(/,\s*([}\]])/g, '$1');
      // Validate
      try { JSON.parse(text); } catch (e) {
        console.warn('Gemini JSON issue:', e.message, 'raw:', text.substring(0, 300));
      }
    }

    const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(c => ({ title: c.web?.title, uri: c.web?.uri }))
      .filter(s => s.title) || [];

    return res.status(200).json({ text, sources, mode });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: 'Gemini service unavailable' });
  }
}
