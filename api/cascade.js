// ── CASCADE PREDICTOR — journey-time & congestion forecasting ─────────────
// Delta principle: if we see heavy traffic NOW at point A,
// predict congestion at point B in N hours
// Also handles: weekend wave prediction, ferry cascade, bura predictive

// ── JOURNEY TIME MATRIX (hours) ───────────────────────────────────────────
const JOURNEY = {
  "zagreb→split":     { h: 4.5, corridor: ["a1_zg_split"], dest: "split_makarska" },
  "zagreb→rijeka":    { h: 2.0, corridor: ["a6_rijeka","a2_macelj"], dest: "kvarner" },
  "zagreb→zadar":     { h: 3.0, corridor: ["a1_zg_split"], dest: "zadar_sibenik" },
  "zagreb→dubrovnik": { h: 6.0, corridor: ["a1_zg_split"], dest: "dubrovnik" },
  "zagreb→pula":      { h: 3.5, corridor: ["a8_istra","a7_rupa"], dest: "istra" },
  "rijeka→stinica":   { h: 1.5, corridor: ["a6_rijeka","jablanac","prizna"], dest: "kvarner" },
  "rijeka→krk":       { h: 0.75, corridor: ["krk_most"], dest: "kvarner" },
  "split→dubrovnik":  { h: 2.5, corridor: ["a1_zg_split","peljesac"], dest: "dubrovnik" },
  "zagreb→kvarner":   { h: 2.0, corridor: ["a6_rijeka"], dest: "kvarner" },
};

// ── FERRY CASCADE — if queue at terminal, suggest alternate ───────────────
const FERRY_ALTERNATES = {
  stinica_misnjak: {
    name: "Stinica → Mišnjak (L337)",
    alternate: "Valbiska → Lopar (L338)",
    alternateNote: "Kraći trajekt, ali Valbiska → Krk → A/D oblaznica (1h više).",
    queueThreshold: 15, // cars in sensor zone
  },
  prizna_zigljen: {
    name: "Prizna → Žigljen (Pag)",
    alternate: "Ostati na kopnu — Sv. Juraj/Jablanac, čekati smanjenje gužve",
    alternateNote: "Nema dobre alternative za Pag. Čekanje 4-6h normalno za Hideout.",
    queueThreshold: 40,
  },
  split_ferries: {
    name: "Split trajekti (Brač, Hvar, Vis)",
    alternate: "Drvenik→Sučuraj za Hvar (manje gužvi), Makarska→Sumartin za Brač",
    queueThreshold: 30,
  },
};

// ── WEEKEND WAVE TIMING ───────────────────────────────────────────────────
// Croatian/European vacation patterns
function getWeekendWave() {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const month = now.getMonth() + 1; // 1-indexed
  const isSeason = month >= 6 && month <= 8; // Jun-Aug peak
  const isPreSeason = month === 5 || month === 9;

  const waves = [];

  // Friday departure wave
  if (day === 5 && h >= 13 && h <= 21 && (isSeason || isPreSeason)) {
    waves.push({
      type: "departure",
      severity: isSeason ? "critical" : "high",
      msg: `PETAK ${h}:00 — odlazni val u punom jeku. A1, A6, A2 maksimum. Doći ćeš 1-2h kasnije od uobičajenog. Kampovi popunjavaju do ponoći.`,
      affected: ["a1_zg_split", "a6_rijeka", "a2_macelj", "a7_rupa", "border"],
    });
  }

  // Saturday morning: camps change-over (Sat check-out 9-11, check-in 13-15)
  if (day === 6 && h >= 7 && h <= 12 && isSeason) {
    waves.push({
      type: "changeover",
      severity: "high",
      msg: `SUBOTA ${h}:00 — peak vikend: kampovi mijenjaju goste. Plaže pune 10-17h. Subota ujutro = NAJGORI termin za trajekte (Jadrolinija). Alternativa: doći u petak navečer ili nedjelja/ponedjeljak.`,
      affected: ["ferry", "parking", "coastal"],
    });
  }

  // Sunday evening return
  if (day === 0 && h >= 15 && h <= 22 && (isSeason || isPreSeason)) {
    waves.push({
      type: "return",
      severity: isSeason ? "high" : "medium",
      msg: `NEDJELJA ${h}:00 — povratni val. A1 prema Zagrebu GUST, posebno čvor Bosiljevo i Zagreb Istok. Kamperi koji se vraćaju: A6 umjesto A1 kroz Slavoniju.`,
      affected: ["a1_zg_split", "a6_rijeka"],
    });
  }

  // Velika Gospa window (Aug 5-15)
  if (month === 8 && now.getDate() >= 5 && now.getDate() <= 15) {
    waves.push({
      type: "holiday",
      severity: "critical",
      msg: "⚠️ VELIKA GOSPA PERIOD (5-15.8.): Najzasićeniji period godine. A1 i D8 maksimum. Medugorje hodočasnici → Neum koridor blokiran. Rezervacije goriva KRITIČNO.",
      affected: ["a1_zg_split", "a6_rijeka", "dubrovnik", "split_makarska", "border"],
    });
  }

  return waves;
}

// ── CASCADE PREDICTION — A detects NOW → B prediction in N hours ──────────
export function buildCascadePrediction(yoloCrowdData, region) {
  if (!yoloCrowdData?.regions) return null;

  const predictions = [];
  const now = new Date();
  const h = now.getHours();

  // Check each corridor
  for (const [route, journey] of Object.entries(JOURNEY)) {
    let corridorCars = 0;
    let active = false;

    for (const sensor of journey.corridor) {
      const data = yoloCrowdData.regions[sensor];
      if (!data) continue;
      corridorCars += data.cars || 0;
      if (data.cars > 5) active = true;
    }

    if (!active || corridorCars < 10) continue;

    // Predict arrival time
    const arrivalHour = h + journey.h;
    const severity = corridorCars > 50 ? "critical" : corridorCars > 20 ? "high" : "medium";

    if (severity !== "medium" && journey.dest === region) {
      predictions.push({
        route,
        carsDetected: corridorCars,
        eta: `${Math.floor(arrivalHour)}:${arrivalHour % 1 >= 0.5 ? "30" : "00"}`,
        severity,
        msg: `Val putnika iz smjera ${route.split("→")[0]} ({${corridorCars}} vozila u koridoru). Očekivani dolazak: ~${Math.floor(arrivalHour)}:${arrivalHour % 1 >= 0.5 ? "30" : "00"}h.`,
      });
    }
  }

  // Ferry cascade
  const ferryData = yoloCrowdData.regions?.rab_ferry || yoloCrowdData.regions?.ferry;
  if (ferryData && ferryData.cars > 15) {
    predictions.push({
      type: "ferry_cascade",
      severity: ferryData.cars > 30 ? "critical" : "high",
      msg: `Dugi red na trajektu (${ferryData.cars} vozila). Razmotri alternativnu liniju ili pričekaj sljedeću plovidbu.`,
    });
  }

  return predictions.length ? predictions : null;
}

// ── BURA PREDICTIVE (DHMZ integration) ───────────────────────────────────
let _buraCache = null;
let _buraCacheTs = 0;
const BURA_TTL = 3600 * 1000; // 1h

export async function fetchBuraPrediction() {
  if (_buraCache && Date.now() - _buraCacheTs < BURA_TTL) return _buraCache;

  // DHMZ open data — XML products (open licence RH, no auth required)
  // Source: meteo.hr/proizvodi.php?section=podaci&param=xml_korisnici
  // Marine + bura forecasts for Adriatic published as XML files
  const DHMZ_URLS = [
    "https://meteo.hr/data/products/textual_forecasts/marine_forecast_adriatic.xml",
    "https://meteo.hr/data/products/warnings/bura_warning.xml",
    "https://meteo.hr/data/products/wind_forecast_adriatic.xml",
  ];

  for (const url of DHMZ_URLS) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; jadran-ai-bot/1.0; +https://jadran.ai)",
          "Accept": "application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) continue;
      const xml = await r.text();
      if (!xml || xml.length < 100) continue;

      const buraAlerts = [];

      // Parse wind speeds from XML (DHMZ uses multiple schemas)
      const windMatches = [...xml.matchAll(/<(?:wind_speed|brzina_vjetra|speed)[^>]*>([\d.]+)<\/[^>]+>/gi)];
      const timeMatches = [...xml.matchAll(/<(?:valid_time|vrijedi_od|time)[^>]*>([^<]+)<\/[^>]+>/gi)];
      const dirMatches  = [...xml.matchAll(/<(?:wind_dir|smjer_vjetra|direction)[^>]*>([^<]+)<\/[^>]+>/gi)];

      for (let i = 0; i < windMatches.length; i++) {
        const wind = parseFloat(windMatches[i][1]);
        const dir  = (dirMatches[i]?.[1] || "").toUpperCase();
        const time = timeMatches[i]?.[1];
        const isBuraDir = !dir || dir.includes("NE") || dir.includes("E") || dir.includes("BURA");

        if (wind > 60 && isBuraDir) {
          const hoursFromNow = time ? (new Date(time) - Date.now()) / 3600000 : 6;
          if (hoursFromNow >= -1 && hoursFromNow <= 24) {
            buraAlerts.push({
              time: time || "uskoro",
              wind: Math.round(wind),
              hoursFromNow: Math.round(Math.max(0, hoursFromNow)),
              severity: wind > 90 ? "critical" : wind > 70 ? "high" : "medium",
            });
          }
        }
      }

      // Fallback: detect bura keyword + speed mention in text forecast
      if (!buraAlerts.length && /bura|jak\s+vjetar|olujn/i.test(xml)) {
        const speedMatch = xml.match(/(\d{2,3})\s*km\/h/);
        if (speedMatch) {
          const wind = parseInt(speedMatch[1]);
          buraAlerts.push({
            time: "uskoro", wind,
            hoursFromNow: 0,
            severity: wind > 80 ? "critical" : "high",
          });
        }
      }

      _buraCache = { alerts: buraAlerts, source: "DHMZ", url, ts: new Date().toISOString() };
      _buraCacheTs = Date.now();
      return _buraCache;
    } catch (e) {
      console.warn(`[cascade] DHMZ ${url.split("/").pop()} failed:`, e.message);
    }
  }

  _buraCache = { alerts: [], source: "DHMZ-unavailable", ts: new Date().toISOString() };
  _buraCacheTs = Date.now();
  return _buraCache;
}

// ── MAIN INTELLIGENCE BUILDER ─────────────────────────────────────────────
export async function buildCascadePrompt(region, yoloCrowdData) {
  const lines = [];

  // 1. Weekend wave
  const waves = getWeekendWave();
  if (waves.length) {
    lines.push("[VAL PUTNIKA — kaskadna prognoza]");
    for (const w of waves) {
      const icon = w.severity === "critical" ? "🚨" : w.severity === "high" ? "⚠️" : "📢";
      lines.push(`${icon} ${w.msg}`);
    }
  }

  // 2. Cascade predictions from YOLO
  const cascade = buildCascadePrediction(yoloCrowdData, region);
  if (cascade?.length) {
    if (!lines.length) lines.push("[KASKADNA PROGNOZA — na osnovu kamera]");
    for (const p of cascade) {
      const icon = p.severity === "critical" ? "🚨" : "⚠️";
      lines.push(`${icon} ${p.msg}`);
    }
  }

  // 3. Bura predictive
  const bura = await fetchBuraPrediction();
  if (bura?.alerts?.length) {
    lines.push("\n[BURA PROGNOZA — Senj/Kvarner]");
    for (const a of bura.alerts) {
      const icon = a.severity === "critical" ? "🚨" : "⚠️";
      lines.push(`${icon} Bura ${a.wind} km/h za ~${a.hoursFromNow}h — PREVENTIVNO: Krčki most može biti zatvoren. Alternativa Crikvenica-Šilo trajekt.`);
    }
  }

  if (!lines.length) return "";

  lines.push(`\nKASKADNA PRAVILA:
- Predvidi: ako je A6 gust SADA → Kvarner kampovi puni za 2h → preporuči sada
- Trajekt kaskada: red na Stinici > 20 vozila → alternativa Valbiska-Lopar (dulja ruta)
- Bura prediktivna: upozori BEFORE zatvaranja, ne kad je već zatvoreno
- Ultra Europe/Velika Gospa: aktiviraj gorivo protokol bez čekanja da pitaju`);

  return lines.join("\n");
}
