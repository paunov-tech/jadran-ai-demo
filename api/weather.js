// Weather API — uses Open-Meteo (FREE, no key, unlimited)
// Rate limit: 60/hour per IP (Open-Meteo is free but be polite)
const _rl = new Map();
function wxRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 60) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!wxRateOk(clientIp)) return res.status(429).json({ error: "Too many requests" });

  try {
    // Accept region coordinates via query params (always passed by client)
    const rawLat = parseFloat(req.query?.lat);
    const rawLon = parseFloat(req.query?.lon);
    // Validate bounds — fall back to Rab if invalid or out of range
    const lat = (rawLat >= -90  && rawLat <= 90)  ? rawLat : 44.7561;
    const lon = (rawLon >= -180 && rawLon <= 180) ? rawLon : 14.7642;
    const loc = (typeof req.query?.loc === "string" ? req.query.loc : "").slice(0, 64) || "Rab";
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,pressure_msl,cloud_cover&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=Europe/Zagreb&forecast_days=2`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=sea_surface_temperature,wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height,wave_period,swell_wave_height&timezone=Europe/Zagreb&forecast_days=1`;

    const [wxRes, marineRes] = await Promise.all([
      fetch(wxUrl),
      fetch(marineUrl).catch(() => null),
    ]);

    const wx = await wxRes.json();
    const marine = marineRes ? await marineRes.json() : null;

    // Map WMO weather codes to emojis
    const wmoEmoji = (code) => {
      if (code <= 1) return "☀️";
      if (code <= 3) return "⛅";
      if (code <= 48) return "🌫️";
      if (code <= 55) return "🌦️";
      if (code <= 65) return "🌧️";
      if (code <= 77) return "🌨️";
      if (code <= 82) return "🌧️";
      if (code <= 86) return "🌨️";
      if (code >= 95) return "⛈️";
      return "☁️";
    };

    // Wind direction to string
    const windDir = (deg) => {
      const dirs = ["S","SSZ","SZ","ZSZ","Z","ZJZ","JZ","JJZ","J","JJI","JI","IJI","I","ISI","SI","SSI"];
      return dirs[Math.round(deg / 22.5) % 16];
    };

    // Adriatic wind names based on direction
    const adriaticWind = (deg, speed) => {
      if (speed < 5) return { name: "Bonaca", desc: "mirno" };
      if (deg >= 10 && deg <= 80) return { name: "Bura", desc: speed > 40 ? "OPASNA" : "umjerena" };
      if (deg >= 100 && deg <= 170) return { name: "Jugo", desc: speed > 30 ? "jako" : "umjereno" };
      if (deg >= 240 && deg <= 310) return { name: "Maestral", desc: "ugodno" };
      if (deg >= 170 && deg <= 240) return { name: "Lebeć", desc: "jugozapad" };
      if (deg >= 310 && deg <= 360) return { name: "Tramontana", desc: "sjever" };
      return { name: "Vjetar", desc: windDir(deg) };
    };

    // Sea condition from wave height
    const seaCondition = (wh) => {
      if (!wh || wh < 0.1) return { state: "mirno", emoji: "🪞", level: 0 };
      if (wh < 0.3) return { state: "malo valovito", emoji: "〰️", level: 1 };
      if (wh < 0.6) return { state: "umjereno", emoji: "🌊", level: 2 };
      if (wh < 1.2) return { state: "valovito", emoji: "🌊", level: 3 };
      if (wh < 2.0) return { state: "jako valovito", emoji: "⚠️", level: 4 };
      return { state: "OPASNO", emoji: "🚨", level: 5 };
    };

    const wDeg = wx.current?.wind_direction_10m || 0;
    const wSpd = Math.round(wx.current?.wind_speed_10m || 0);
    const wh = marine?.current?.wave_height || 0;
    const aWind = adriaticWind(wDeg, wSpd);
    const seaCond = seaCondition(wh);

    const current = {
      temp: Math.round(wx.current?.temperature_2m || 20),
      feelsLike: Math.round(wx.current?.apparent_temperature || 20),
      icon: wmoEmoji(wx.current?.weather_code || 0),
      uv: Math.round(wx.current?.uv_index || 5),
      wind: `${windDir(wDeg)} ${wSpd} km/h`,
      windSpeed: wSpd,
      windDir: windDir(wDeg),
      windDeg: wDeg,
      windName: aWind.name,
      windDesc: aWind.desc,
      gusts: Math.round(wx.current?.wind_gusts_10m || 0),
      humidity: Math.round(wx.current?.relative_humidity_2m || 50),
      pressure: Math.round(wx.current?.pressure_msl || 1013),
      sea: Math.round(marine?.current?.sea_surface_temperature || 18),
      seaState: seaCond.state,
      seaEmoji: seaCond.emoji,
      seaLevel: seaCond.level,
      waveHeight: wh,
      wavePeriod: Math.round(marine?.current?.wave_period || 0),
      waveDir: windDir(marine?.current?.wave_direction || 0),
      swellHeight: marine?.current?.swell_wave_height || 0,
      swellDir: windDir(marine?.current?.swell_wave_direction || 0),
      swellPeriod: Math.round(marine?.current?.swell_wave_period || 0),
      cloudCover: Math.round(wx.current?.cloud_cover || 0),
      sunset: wx.daily?.sunset?.[0]?.split("T")[1]?.substring(0, 5) || "19:00",
      sunrise: wx.daily?.sunrise?.[0]?.split("T")[1]?.substring(0, 5) || "06:00",
    };

    const forecast = (wx.daily?.temperature_2m_max || []).map((h, i) => ({
      di: i,
      icon: wmoEmoji(wx.daily.weather_code[i] || 0),
      h: Math.round(h),
      l: Math.round(wx.daily.temperature_2m_min[i] || h - 8),
    }));

    // Hourly — next 12 slots from current hour
    const nowHour = new Date().getHours();
    const hourlyTimes = wx.hourly?.time || [];
    const startIdx = hourlyTimes.findIndex(t => {
      const h = new Date(t).getHours();
      return h >= nowHour;
    });
    const si = startIdx >= 0 ? startIdx : 0;
    const hourly = hourlyTimes.slice(si, si + 12).map((t, i) => ({
      h: t.split("T")[1]?.substring(0, 5) || "",
      temp: Math.round(wx.hourly.temperature_2m?.[si + i] ?? 20),
      wind: Math.round(wx.hourly.wind_speed_10m?.[si + i] ?? 0),
      gusts: Math.round(wx.hourly.wind_gusts_10m?.[si + i] ?? 0),
      rain: Math.round(wx.hourly.precipitation_probability?.[si + i] ?? 0),
      icon: wmoEmoji(wx.hourly.weather_code?.[si + i] ?? 0),
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ current, forecast, hourly });
  } catch (err) {
    console.error('[WEATHER] Error:', err.message);
    return res.status(200).json({ current: null, forecast: null, error: err.message });
  }
}
