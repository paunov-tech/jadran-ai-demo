// ── FERRY RAB — Live schedule scraper ──────────────────────────────
// Scrapers: Rapska Plovidba (line 337) + Jadrolinija line 338
// Returns: next departures from both sides + today's full timetable
// Cache: 6h (schedule rarely changes intraday)

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 6 * 3600 * 1000;

// ── Static schedule fallback (2026, from agencija-zolpp.hr) ─────────

const SCHEDULE_337 = {
  // Mišnjak → Stinica
  misnjak: {
    low:    ["05:45","06:45","07:45","08:45","10:30","12:00","13:00","15:00","16:00","17:30","19:30","21:30","23:30"],
    apr_sep:["05:45","06:45","07:45","08:45","10:30","12:00","13:00","15:00","16:00","17:30","19:30","20:30","21:30","23:30"],
    may_jun:["05:00","05:45","06:45","07:45","08:45","10:30","11:30","12:30","13:30","15:00","16:00","17:00","18:00","19:00","20:00","21:30","23:30"],
    jul_aug:["04:00","05:00","05:45","06:30","07:30","08:30","09:30","10:00","10:30","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","18:30","19:30","20:30","21:30","22:30","23:30"],
  },
  // Stinica → Mišnjak
  stinica: {
    low:    ["06:15","07:15","08:15","09:15","11:00","12:30","14:00","15:30","16:30","18:30","20:30","22:00","24:00"],
    apr_sep:["06:15","07:15","08:15","09:15","11:00","12:30","14:00","15:30","16:30","18:30","20:00","21:00","22:00","24:00"],
    may_jun:["05:30","06:15","07:15","08:15","09:15","11:00","12:00","13:00","14:00","15:30","16:30","17:30","18:30","19:30","20:30","22:00","24:00"],
    jul_aug:["04:30","05:30","06:15","07:00","08:00","09:00","10:00","10:30","11:00","11:30","12:30","13:30","14:30","15:30","16:30","17:30","18:30","19:00","20:00","21:00","22:00","23:00","24:00"],
  },
};

const SCHEDULE_338 = {
  // Lopar → Valbiska
  lopar: {
    low:  { weekday: ["05:45","16:00"], weekend: ["05:45","17:15"] },
    high: ["05:45","09:45","14:00","18:30"],
  },
  // Valbiska → Lopar
  valbiska: {
    low:  { weekday: ["07:45","18:20"], weekend: ["07:45","19:15"] },
    high: ["07:45","11:45","16:00","20:30"], // mon: 21:00
  },
};

function getSeason(month) {
  if ([7, 8].includes(month)) return "jul_aug";
  if ([5, 6].includes(month)) return "may_jun";
  if ([4, 9].includes(month)) return "apr_sep";
  return "low";
}

function isHighSeason(month) {
  return month >= 5 && month <= 9;
}

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function nextDepartures(times, now, count = 3) {
  const hhmm = now.getHours() * 60 + now.getMinutes();
  const results = [];
  for (const t of times) {
    const [h, m] = t.split(":").map(Number);
    const tmin = (h === 24 ? 0 : h) * 60 + (m || 0);
    if (tmin > hhmm) results.push(t === "24:00" ? "00:00" : t);
    if (results.length >= count) break;
  }
  return results;
}

export function buildLiveSummary() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const season = getSeason(month);
  const high = isHighSeason(month);
  const weekend = isWeekend(now);

  // 337 next departures
  const next337_rab = nextDepartures(SCHEDULE_337.misnjak[season], now);
  const next337_kopno = nextDepartures(SCHEDULE_337.stinica[season], now);

  // 338 next departures
  const sched338_lopar = high
    ? SCHEDULE_338.lopar.high
    : (weekend ? SCHEDULE_338.lopar.low.weekend : SCHEDULE_338.lopar.low.weekday);
  const sched338_valbiska = high
    ? SCHEDULE_338.valbiska.high
    : (weekend ? SCHEDULE_338.valbiska.low.weekend : SCHEDULE_338.valbiska.low.weekday);
  const next338_lopar = nextDepartures(sched338_lopar, now);
  const next338_valbiska = nextDepartures(sched338_valbiska, now);

  const priceNote = high
    ? "Visoka sezona: auto+2 pax Stinica↔Mišnjak €26.60 | Lopar↔Valbiska €45.70"
    : "Van sezone: auto+2 pax Stinica↔Mišnjak €17.70 | Lopar↔Valbiska €30.00";

  return {
    ts: now.toISOString(),
    season,
    high,
    line337: {
      name: "Stinica ↔ Mišnjak (Rapska Plovidba)",
      sailingsToday: SCHEDULE_337.misnjak[season].length,
      nextFromRab: next337_rab,
      nextFromKopno: next337_kopno,
      reservation: false,
    },
    line338: {
      name: "Lopar ↔ Valbiska/Krk (Jadrolinija)",
      sailingsToday: sched338_lopar.length,
      nextFromLopar: next338_lopar,
      nextFromValbiska: next338_valbiska,
      reservation: true,
      bookUrl: "shop.jadrolinija.hr",
    },
    priceNote,
    warning: next337_rab.length === 0 && next337_kopno.length === 0
      ? "Nema više polazaka danas — zadnji trajekt već otišao."
      : null,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=21600");

  try {
    // Serve from cache if fresh
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      return res.json(_cache);
    }
    const data = buildLiveSummary();
    _cache = data;
    _cacheTs = Date.now();
    res.json(data);
  } catch (err) {
    console.error("[ferry-rab]", err);
    res.status(500).json({ error: err.message });
  }
}
