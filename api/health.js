export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say OK' }],
      }),
    });
    
    const data = await response.json();
    return res.status(200).json({
      status: 'ok',
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
      anthropicStatus: response.status,
      anthropicResponse: data,
    });
  } catch (err) {
    return res.status(200).json({
      status: 'error',
      hasApiKey: !!apiKey,
      error: err.message,
    });
  }
}
