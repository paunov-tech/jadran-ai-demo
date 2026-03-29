export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://jadran.ai');
  res.setHeader('Cache-Control', 'no-store');
  // Return minimal health info — don't leak which services are configured
  return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
