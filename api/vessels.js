// api/vessels.js — Jadran AIS Vessel Tracker
// PRIMARY:  aisstream.io WebSocket (free after registration — add AISSTREAM_KEY to env)
// FALLBACK: Realistic simulation of known Rab/Kvarner routes + marina positions
// GET /api/vessels?lat=44.75&lng=14.78&r=60   (r = radius km)

const AISSTREAM_KEY = process.env.AISSTREAM_KEY;
const CORS = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── Vessel type labels ───────────────────────────────────────
const TYPE_LABEL = {
  0: "Nepoznato", 1: "Rezervirano", 20: "WIG", 21: "WIG", 22: "WIG",
  30: "Ribarica", 31: "Tegljač", 32: "Tegljač", 33: "Ronilac",
  35: "Vojni brod", 36: "Jedrilica", 37: "Plovilo za zabavu",
  50: "Pilot", 51: "SAR", 52: "Tegljač", 53: "Lučka plovila", 55: "Policija",
  60: "Putnički brod", 61: "Putnički brod", 62: "Putnički brod",
  69: "Putnički brod", 70: "Teretni brod", 71: "Teretni brod",
  79: "Teretni brod", 80: "Tanker", 89: "Tanker",
};
function vesselTypeLabel(t) {
  if (!t) return "Plovilo";
  if (t >= 60 && t <= 69) return "Trajekt/Putnički";
  if (t >= 70 && t <= 79) return "Teretni brod";
  if (t >= 80 && t <= 89) return "Tanker";
  if (t === 37 || (t >= 31 && t <= 36)) return "Jahta/Jedrilica";
  if (t === 30) return "Ribarica";
  return TYPE_LABEL[t] || "Plovilo";
}

// ─── aisstream.io WebSocket fetch ────────────────────────────
async function fetchAISStream(bbox) {
  if (!AISSTREAM_KEY) return null;
  // bbox: [minLat, minLng, maxLat, maxLng]
  return new Promise((resolve) => {
    const vessels = {};
    const timeout = setTimeout(() => {
      ws.close();
      resolve(Object.values(vessels));
    }, 8000); // collect 8s of messages

    let ws;
    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      ws.onopen = () => {
        ws.send(JSON.stringify({
          Apikey: AISSTREAM_KEY,
          BoundingBoxes: [[bbox]],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        }));
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const pos = msg.Message?.PositionReport;
          const stat = msg.Message?.ShipStaticData;
          const meta = msg.MetaData;
          if (!meta?.MMSI) return;
          const mmsi = String(meta.MMSI);
          if (!vessels[mmsi]) vessels[mmsi] = { mmsi };
          if (pos) {
            vessels[mmsi].lat     = pos.Latitude;
            vessels[mmsi].lng     = pos.Longitude;
            vessels[mmsi].sog     = pos.Sog;   // speed over ground (knots)
            vessels[mmsi].cog     = pos.Cog;   // course over ground
            vessels[mmsi].status  = pos.NavigationalStatus;
          }
          if (stat) {
            vessels[mmsi].name    = stat.Name?.trim() || "";
            vessels[mmsi].type    = stat.Type;
            vessels[mmsi].dest    = stat.Destination?.trim() || "";
            vessels[mmsi].length  = stat.Dimension?.A + stat.Dimension?.B || null;
          }
          if (meta.ShipName && !vessels[mmsi].name)
            vessels[mmsi].name = meta.ShipName.trim();
          vessels[mmsi].ts = new Date().toISOString();
        } catch {}
      };
      ws.onerror = () => { clearTimeout(timeout); ws.close(); resolve(Object.values(vessels)); };
      ws.onclose = () => { clearTimeout(timeout); resolve(Object.values(vessels)); };
    } catch (e) {
      console.warn("[vessels] aisstream WebSocket:", e.message);
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

// ─── Realistic simulation — Rab/Kvarner known routes ─────────
// Used when AISSTREAM_KEY is absent or demo mode
function simulateVessels() {
  const now = new Date();
  const h = now.getHours();
  const min = now.getMinutes();
  const phase = (h * 60 + min) / (24 * 60); // 0–1 through the day

  // Known Rab/Kvarner ferry routes + marinas
  const vessels = [
    // ── Jadrolinija ferries (Mišnjak–Jablanac route, ~30 min crossing) ──
    {
      mmsi: "238123001", name: "RAPSKA PLOVIDBA",
      type: 60, typeLabel: "Trajekt",
      lat: 44.743 + Math.sin(phase * Math.PI * 24) * 0.038,
      lng: 14.755 + Math.cos(phase * Math.PI * 24) * 0.028,
      sog: h >= 6 && h <= 22 ? (5 + Math.random() * 4).toFixed(1) : "0.0",
      cog: Math.round(45 + Math.sin(phase * Math.PI * 12) * 135),
      dest: Math.sin(phase * Math.PI * 24) > 0 ? "JABLANAC" : "MISNJAK",
      flag: "HR", length: 68,
    },
    // ── Lopar–Valbiska (Krk) Jadrolinija ──
    {
      mmsi: "238123002", name: "PETAR HEKTOROVIĆ",
      type: 60, typeLabel: "Trajekt",
      lat: 44.838 + Math.cos(phase * Math.PI * 18) * 0.052,
      lng: 14.703 + Math.sin(phase * Math.PI * 18) * 0.065,
      sog: h >= 7 && h <= 21 ? (6 + Math.random() * 3).toFixed(1) : "0.0",
      cog: Math.round(330 + Math.sin(phase * Math.PI * 9) * 60),
      dest: Math.cos(phase * Math.PI * 18) > 0 ? "VALBISKA KRK" : "LOPAR",
      flag: "HR", length: 72,
    },
    // ── Rab–Rijeka Jadrolinija liner ──
    {
      mmsi: "238456001", name: "DUBROVNIK",
      type: 61, typeLabel: "Trajekt",
      lat: 44.720 + (h >= 8 && h <= 20 ? (h - 8) / 12 * 0.8 : 0),
      lng: 14.750 + (h >= 8 && h <= 20 ? (h - 8) / 12 * 0.35 : 0),
      sog: h >= 8 && h <= 20 ? "11.2" : "0.0",
      cog: h >= 8 && h <= 14 ? 310 : 130,
      dest: h >= 8 && h <= 14 ? "RIJEKA" : "RAB",
      flag: "HR", length: 98,
    },
    // ── Marina Rab — moored yachts (random positions within marina) ──
    ...[...Array(Math.floor(4 + (h >= 10 && h <= 20 ? 8 : 2)))].map((_, i) => ({
      mmsi: `23890${1000 + i}`, name: `JAHTA ${["ADRIANA","BORA","CORA","DEJA","ELA","FLORA","GAIA","HERA"][i] || `YHT-${i+1}`}`,
      type: 37, typeLabel: "Jahta",
      lat: 44.756 + (Math.random() - 0.5) * 0.006,
      lng: 14.763 + (Math.random() - 0.5) * 0.006,
      sog: h >= 8 && h <= 20 && Math.random() > 0.7 ? (2 + Math.random() * 5).toFixed(1) : "0.0",
      cog: Math.round(Math.random() * 360),
      dest: "", flag: ["HR","AT","DE","IT","SI"][i % 5],
      length: Math.round(8 + Math.random() * 24),
    })),
    // ── Lopar anchorage — tourist motor boats ──
    ...[...Array(h >= 9 && h <= 19 ? 5 : 1)].map((_, i) => ({
      mmsi: `23892${1000 + i}`, name: `GLISER ${i + 1}`,
      type: 37, typeLabel: "Motorna jedrilica",
      lat: 44.838 + (Math.random() - 0.5) * 0.015,
      lng: 14.706 + (Math.random() - 0.5) * 0.018,
      sog: (1 + Math.random() * 8).toFixed(1),
      cog: Math.round(Math.random() * 360),
      dest: "RAJSKA PLAŽA", flag: "HR", length: Math.round(5 + Math.random() * 12),
    })),
    // ── Cargo — Rijeka shipping lane ──
    {
      mmsi: "247123456", name: "ALLEGRA",
      type: 70, typeLabel: "Teretni brod",
      lat: 44.95 + (phase * 0.6 - 0.3),
      lng: 14.22 + (phase * 0.4),
      sog: "9.4", cog: 135, dest: "RIJEKA", flag: "IT", length: 142,
    },
  ];

  return vessels.map(v => ({
    ...v,
    typeLabel: v.typeLabel || vesselTypeLabel(v.type),
    ts: new Date().toISOString(),
    source: "sim",
  })).filter(v => v.lat && v.lng);
}

// ─── Handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "GET only" });

  // Cache
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return res.status(200).json({ ..._cache, cached: true });
  }

  const lat = parseFloat(req.query?.lat || "44.75");
  const lng = parseFloat(req.query?.lng || "14.78");
  const r   = parseFloat(req.query?.r   || "60");

  // bbox from center + radius (rough degrees)
  const dLat = r / 111;
  const dLng = r / (111 * Math.cos(lat * Math.PI / 180));
  const bbox = [lat - dLat, lng - dLng, lat + dLat, lng + dLng];

  let vessels = null;
  let source  = "simulation";

  if (AISSTREAM_KEY) {
    vessels = await fetchAISStream(bbox);
    if (vessels && vessels.length > 0) {
      source = "aisstream";
      // Enrich with type labels
      vessels = vessels.map(v => ({ ...v, typeLabel: vesselTypeLabel(v.type) }));
    } else {
      vessels = null;
    }
  }

  if (!vessels) {
    vessels = simulateVessels();
    source  = "simulation";
  }

  // Stats
  const ferries  = vessels.filter(v => v.type >= 60 && v.type <= 69);
  const cargo    = vessels.filter(v => v.type >= 70 && v.type <= 79);
  const pleasure = vessels.filter(v => v.type === 37 || v.type === 36);
  const moving   = vessels.filter(v => parseFloat(v.sog) > 0.5);

  const payload = {
    ts:        new Date().toISOString(),
    source,
    live:      source === "aisstream",
    bbox,
    total:     vessels.length,
    ferries:   ferries.length,
    cargo:     cargo.length,
    pleasure:  pleasure.length,
    moving:    moving.length,
    vessels:   vessels.slice(0, 80),
  };

  _cache   = payload;
  _cacheTs = Date.now();
  return res.status(200).json(payload);
}
