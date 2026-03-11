// Fetches Wikipedia thumbnail for a Croatian city
// GET /api/cityimg?city=Split
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800'); // cache 1 day client, 1 week CDN
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'Missing city param' });
  
  // Map display names to Wikipedia article titles
  const wikiMap = {
    'Split': 'Split,_Croatia',
    'Makarska': 'Makarska',
    'Hvar': 'Hvar',
    'Rovinj': 'Rovinj',
    'Pula': 'Pula,_Croatia',
    'Opatija': 'Opatija',
    'Dubrovnik': 'Dubrovnik',
    'Zadar': 'Zadar',
    'Krk': 'Krk_(city)',
  };
  
  const title = wikiMap[city] || city;
  
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'JadranAI/1.0 (jadran.ai; tourist guide)' }
    });
    const data = await resp.json();
    
    // Get the original image URL and resize
    const originalUrl = data.originalimage?.source || data.thumbnail?.source;
    
    if (!originalUrl) {
      return res.status(404).json({ error: 'No image found' });
    }
    
    // For Wikimedia Commons, we can request specific width via thumb URL
    // Original: https://upload.wikimedia.org/wikipedia/commons/X/XX/File.jpg
    // Thumb:    https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/File.jpg/600px-File.jpg
    let thumbUrl = originalUrl;
    if (originalUrl.includes('upload.wikimedia.org') && !originalUrl.includes('/thumb/')) {
      thumbUrl = originalUrl.replace('/commons/', '/commons/thumb/').replace(/\/([^/]+)$/, '/$1/600px-$1');
    } else if (data.thumbnail?.source) {
      // Use thumbnail but request larger size
      thumbUrl = data.thumbnail.source.replace(/\/\d+px-/, '/600px-');
    }
    
    return res.status(200).json({ 
      url: thumbUrl, 
      title: data.title,
      description: data.description 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
