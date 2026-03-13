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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit check
  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  if (!rateOk(clientIp)) {
    return res.status(429).json({ content: [{ type: "text", text: "Dnevni limit dosegnut. Pokušajte sutra ili nadogradite na Premium." }] });
  }


  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured', text: '' });

  try {
    const { prompt, mode } = req.body;

    const INSTRUCTIONS = {
      weather: 'Return ONLY a JSON object: {"temp":NUMBER,"icon":"EMOJI","uv":NUMBER,"wind":"STRING","humidity":NUMBER,"sea":NUMBER,"sunset":"HH:MM","description":"STRING"}. Use real current data. No markdown.',
      forecast: 'Return ONLY a JSON array of 7 objects: [{"di":0,"icon":"EMOJI","h":NUMBER,"l":NUMBER},...]. Celsius integers. Real forecast. No markdown.',
      practical: 'Return ONLY a JSON array: [{"name":"STRING","note":"STRING with hours prices distances","warn":false},...]. 5-8 items. Real data. No markdown.',
      places: 'Return ONLY a JSON array of places: [{"name":"STRING","type":"STRING","note":"STRING"},...]. Max 5. Real data. No markdown.',
      grounded: 'Provide current factual information for tourists on the Croatian Adriatic coast. Be concise.',
    };

    const sys = INSTRUCTIONS[mode] || INSTRUCTIONS.grounded;
    const jsonModes = ['weather', 'forecast', 'places', 'practical'];
    const isJson = jsonModes.includes(mode);

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: sys }] },
      generationConfig: {
        temperature: isJson ? 0.1 : 0.7,
        maxOutputTokens: 1024,
      },
      tools: [{ googleSearch: {} }],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Debug: log full response structure
    
    
    if (data.error) {
      console.error('[GEMINI] API Error:', JSON.stringify(data.error));
      return res.status(200).json({ text: '', error: data.error.message || 'Gemini error', debug: data.error });
    }
    if (!data.candidates || data.candidates.length === 0) {
      
      return res.status(200).json({ text: '', error: 'No candidates', debug: JSON.stringify(data).substring(0, 300) });
    }

    let text = data.candidates[0]?.content?.parts
      ?.map(p => p.text || '')
      .filter(Boolean)
      .join('') || '';

    

    // Robust JSON extraction
    if (isJson && text) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
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
      text = text.replace(/,\s*([}\]])/g, '$1');
    }

    const sources = data.candidates[0]?.groundingMetadata?.groundingChunks
      ?.map(c => ({ title: c.web?.title, uri: c.web?.uri }))
      .filter(s => s.title) || [];

    return res.status(200).json({ text, sources, mode });
  } catch (err) {
    console.error('[GEMINI] Exception:', err.message, err.stack);
    return res.status(200).json({ text: '', error: err.message });
  }
}
