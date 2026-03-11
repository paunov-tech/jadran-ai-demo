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

    // Mode determines which Gemini capability to use
    // "grounded" = Google Search grounding (real-time info)
    // "places"   = Local recommendations with current data
    // "weather"  = Current weather conditions

    const systemInstruction = mode === 'weather'
      ? 'You are a weather assistant for the Croatian Adriatic coast. Return ONLY valid JSON with fields: temp, feelsLike, icon (emoji), uv, wind, humidity, sea, sunset, description. No markdown, no explanation.'
      : mode === 'forecast'
      ? 'You are a weather forecast assistant for the Croatian Adriatic coast. Return ONLY a valid JSON array of 7 objects, one per day starting today, each with fields: di (0-6 for day index), icon (weather emoji), h (high temp °C integer), l (low temp °C integer). No markdown, no explanation, no extra text.'
      : mode === 'places'
      ? 'You are a local guide for Split and central Dalmatia, Croatia. Return ONLY valid JSON array of places with fields: name, type, distance, rating, priceRange, openNow (boolean), note. Max 5 results. No markdown.'
      : mode === 'practical'
      ? 'You are a local information assistant for tourists. Return ONLY valid JSON array of objects with fields: name (string), note (string with practical info like hours, prices, distance), warn (boolean, true only for emergencies). Max 8 results. Current, factual data only. No markdown.'
      : 'You are a real-time information assistant for tourists on the Croatian Adriatic coast (Split, Podstrana, Omiš, Trogir area). Provide current, factual information. Be concise. Include opening hours, prices, and practical details.';

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: mode === 'weather' || mode === 'places' ? 0.1 : 0.7,
        maxOutputTokens: 1024,
      },
    };

    // Add Google Search grounding for real-time queries
    if (mode === 'grounded' || mode === 'places' || mode === 'weather' || mode === 'forecast' || mode === 'practical') {
      body.tools = [{ googleSearch: {} }];
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .filter(Boolean)
      .join('') || '';

    // Extract grounding sources if available
    const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(c => ({ title: c.web?.title, uri: c.web?.uri }))
      .filter(s => s.title) || [];

    return res.status(200).json({ text, sources });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: 'Gemini service unavailable' });
  }
}
