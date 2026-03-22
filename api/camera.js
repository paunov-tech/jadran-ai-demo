// api/camera.js — Beach & Marina Crowd Status
// Currently returns mock data; ready for real camera/IoT integration
// Future: replace with actual computer vision API (AWS Rekognition, Azure Vision, custom model)

const CACHE = { data: null, ts: 0 };
const CACHE_TTL = 600000; // 10 min

function getMockData() {
  const hour = new Date().getHours();
  // Crowd levels vary by time of day (realistic simulation)
  const beachCrowd = hour < 8 ? "mirno" : hour < 10 ? "malo gužve" : hour < 13 ? "srednje gužve" : hour < 17 ? "jako gužva" : hour < 19 ? "srednje gužve" : "mirno";
  const beachPct = hour < 8 ? 5 : hour < 10 ? 20 : hour < 13 ? 55 : hour < 17 ? 85 : hour < 19 ? 50 : 15;
  const boatCount = hour < 7 ? 2 : hour < 10 ? 8 : hour < 14 ? 18 : hour < 18 ? 24 : hour < 21 ? 16 : 6;
  const touristCount = hour < 8 ? 47 : hour < 10 ? 312 : hour < 14 ? 847 : hour < 18 ? 1240 : hour < 21 ? 680 : 190;

  return {
    beach: {
      name: "Plaža Podstrana",
      crowd: beachCrowd,
      occupancy_pct: beachPct,
      tourists: touristCount,
      recommendation: beachPct < 30 ? "Savršen trenutak — gotovo prazno!" : beachPct < 60 ? "Ugodno — ima mjesta" : beachPct < 80 ? "Gužva — dođite rano ujutro" : "Jako gužva — preporučamo alternativu",
      best_time: "07:00–09:00",
    },
    marina: {
      name: "Luka Podstrana",
      boats: boatCount,
      free_moorings: Math.max(0, 30 - boatCount),
      status: boatCount < 10 ? "slobodno" : boatCount < 20 ? "umjereno" : "popunjeno",
    },
    parking: {
      name: "Parking Podstrana Centar",
      free_spots: Math.max(0, Math.floor(80 - (beachPct * 0.7))),
      total_spots: 80,
      status: beachPct < 40 ? "slobodno" : beachPct < 75 ? "umjereno" : "gotovo puno",
    },
    updated: new Date().toISOString(),
    source: "mock", // change to "camera" when real integration is live
    note: "Podaci se ažuriraju svakih 10 minuta · Kamera integracija u razvoju",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://monte-negro.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=120");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json(CACHE.data);
  }

  const data = getMockData();
  CACHE.data = data;
  CACHE.ts = Date.now();
  return res.status(200).json(data);
}
