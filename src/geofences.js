// src/geofences.js — JADRAN.AI Geofence Intelligence
// Discrete zones along AT→SLO→HR corridor + coastal destinations
// AT/SLO/HR = Schengen — no border, but congestion + random checks possible

// Haversine distance in km
export function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Zone types: schengen_transition, bura, ferry, toll, city, destination
// radius in km, trigger: "enter" (first time inside) or "approach" (within radius)
export const ZONES = [
  // ═══ SCHENGEN TRANSITIONS (no border but congestion + random checks) ═══
  // AT → SLO
  { id: "sch_karavanke", lat: 46.443, lng: 14.081, radius: 5, type: "schengen_transition", country_from: "AT", country_to: "SI",
    name: { hr: "Karavanke tunel", de: "Karawankentunnel", en: "Karavanke tunnel" },
    card: { hr: "Prelaz AT→SLO. Schengen — nema granice, ali moguće gužve u tunelu. Vinjeta SLO obavezna!", de: "Übergang AT→SLO. Schengen — keine Grenze, aber Stau im Tunnel möglich. Vignette SLO Pflicht!", en: "AT→SLO crossing. Schengen — no border, but tunnel congestion possible. SLO vignette required!" },
    segment_extra: { kamper: { hr: "Kamper: visina tunela 4.1m — provjerite svoj krov!", de: "Camper: Tunnelhöhe 4.1m — Dachhöhe prüfen!" } },
  },
  { id: "sch_spielfeld", lat: 46.693, lng: 15.636, radius: 4, type: "schengen_transition", country_from: "AT", country_to: "SI",
    name: { hr: "Spielfeld / Šentilj", de: "Spielfeld / Šentilj", en: "Spielfeld / Šentilj" },
    card: { hr: "Prelaz AT→SLO (A9/A1). Schengen — moguća gužva vikendima. Vinjeta SLO!", de: "Übergang AT→SLO (A9/A1). Schengen — Stau am Wochenende möglich. Vignette SLO!", en: "AT→SLO crossing (A9/A1). Schengen — weekend congestion possible. SLO vignette!" },
  },
  { id: "sch_loibl", lat: 46.427, lng: 14.265, radius: 3, type: "schengen_transition", country_from: "AT", country_to: "SI",
    name: { hr: "Ljubelj / Loibl", de: "Loiblpass", en: "Loibl pass" },
    card: { hr: "Prelaz AT→SLO (Ljubelj). Sporedni prijelaz — manje gužve.", de: "Übergang AT→SLO (Loibl). Nebenroute — weniger Stau.", en: "AT→SLO crossing (Loibl). Side route — less congestion." },
    segment_extra: { kamper: { hr: "Kamper: Ljubelj tunel — ograničena visina, provjeri!", de: "Camper: Loibltunnel — Höhenbeschränkung!" } },
  },
  // SLO → HR  
  { id: "sch_obrezje", lat: 45.843, lng: 15.693, radius: 4, type: "schengen_transition", country_from: "SI", country_to: "HR",
    name: { hr: "Obrežje / Bregana", de: "Obrežje / Bregana", en: "Obrežje / Bregana" },
    card: { hr: "Prelaz SLO→HR (A2/A3). Schengen — ali moguće vanredne kontrole i gužve ljeti!", de: "Übergang SLO→HR (A2/A3). Schengen — aber mögliche Sonderkontrollen und Sommerstaus!", en: "SLO→HR crossing (A2/A3). Schengen — but random checks and summer congestion possible!" },
    segment_extra: { kamper: { hr: "Kamper: Bregana naplatna za A3 — pripremite ENC ili kune/EUR", de: "Camper: Bregana Maut — ENC oder EUR bereithalten" } },
  },
  { id: "sch_rupa", lat: 45.474, lng: 14.268, radius: 3, type: "schengen_transition", country_from: "SI", country_to: "HR",
    name: { hr: "Rupa / Jelšane", de: "Rupa / Jelšane", en: "Rupa / Jelšane" },
    card: { hr: "Prelaz SLO→HR (A7). Smjer Rijeka/Kvarner. Moguće gužve petkom popodne!", de: "Übergang SLO→HR (A7). Richtung Rijeka/Kvarner. Freitagnachmittag Stau möglich!", en: "SLO→HR crossing (A7). Direction Rijeka/Kvarner. Friday afternoon congestion!" },
  },
  { id: "sch_macelj", lat: 46.237, lng: 15.803, radius: 3, type: "schengen_transition", country_from: "SI", country_to: "HR",
    name: { hr: "Gruškovje / Macelj", de: "Gruškovje / Macelj", en: "Gruškovje / Macelj" },
    card: { hr: "Prelaz SLO→HR (A2). Smjer Zagreb. Schengen — ali vikend gužve česte!", de: "Übergang SLO→HR (A2). Richtung Zagreb. Schengen — Wochenendstau häufig!", en: "SLO→HR crossing (A2). Direction Zagreb. Schengen — weekend jams common!" },
  },
  // SLO → HR (Istra)
  { id: "sch_dragonja", lat: 45.473, lng: 13.718, radius: 3, type: "schengen_transition", country_from: "SI", country_to: "HR",
    name: { hr: "Dragonja / Kaštel", de: "Dragonja / Kaštel", en: "Dragonja / Kaštel" },
    card: { hr: "Prelaz SLO→HR (Istra). Schengen — ljeti enormne gužve subotom!", de: "Übergang SLO→HR (Istrien). Schengen — Samstags im Sommer enormer Stau!", en: "SLO→HR crossing (Istria). Schengen — massive Saturday summer jams!" },
  },

  // ═══ BURA CORRIDORS ═══
  { id: "bura_senj", lat: 44.989, lng: 14.905, radius: 8, type: "bura",
    name: { hr: "Senj — bura zona", de: "Senj — Bora-Zone", en: "Senj — bora zone" },
    card: { hr: "⚠️ Ulazite u zonu bure (Senj). Provjerite HAK.hr! Kamperima zabrana kod jakih udara.", de: "⚠️ Bora-Zone (Senj). ASFINAG/HAK prüfen! Campern bei starken Böen verboten.", en: "⚠️ Entering bora zone (Senj). Check HAK.hr! Campers banned in strong gusts." },
    segment_extra: { kamper: { hr: "KAMPER UPOZORENJE: Senj magistrala — zabrana za vozila >5m pri buri >80km/h. Alternativa: A1 tunel Sv.Rok", de: "CAMPER-WARNUNG: Senj — Verbot für Fahrzeuge >5m bei Bora >80km/h. Alternative: A1 Tunnel Sv.Rok" } },
  },
  { id: "bura_maslenica", lat: 44.250, lng: 15.531, radius: 6, type: "bura",
    name: { hr: "Maslenički most", de: "Maslenica-Brücke", en: "Maslenica bridge" },
    card: { hr: "⚠️ Maslenički most — zona bure. Mogući zastoji i zabrane za visoka vozila.", de: "⚠️ Maslenica-Brücke — Bora-Zone. Mögliche Sperren für hohe Fahrzeuge.", en: "⚠️ Maslenica bridge — bora zone. Possible bans for tall vehicles." },
  },
  { id: "bura_krk_most", lat: 45.221, lng: 14.569, radius: 4, type: "bura",
    name: { hr: "Krčki most", de: "Krk-Brücke", en: "Krk bridge" },
    card: { hr: "⚠️ Krčki most — bura može zatvoriti most! Provjerite HAK.", de: "⚠️ Krk-Brücke — Bora kann Brücke sperren! HAK prüfen.", en: "⚠️ Krk bridge — bora can close bridge! Check HAK." },
    segment_extra: { kamper: { hr: "KAMPER: Krčki most zatvoren za kampere pri buri! Alternativa: trajekt Valbiska.", de: "CAMPER: Krk-Brücke bei Bora gesperrt! Alternative: Fähre Valbiska." } },
  },

  // ═══ TOLL PLAZAS ═══
  { id: "toll_lucko", lat: 45.762, lng: 15.877, radius: 3, type: "toll",
    name: { hr: "NP Lučko", de: "Maut Lučko", en: "Lučko toll" },
    card: { hr: "Naplatna Lučko — pripremite ENC karticu ili EUR. Moguće kolone!", de: "Mautstelle Lučko — ENC oder EUR bereithalten. Stau möglich!", en: "Lučko toll — prepare ENC card or EUR. Queues possible!" },
  },
  { id: "toll_dugopolje", lat: 43.581, lng: 16.574, radius: 3, type: "toll",
    name: { hr: "NP Dugopolje", de: "Maut Dugopolje", en: "Dugopolje toll" },
    card: { hr: "Naplatna Dugopolje — zadnja naplatna prije Splita!", de: "Mautstelle Dugopolje — letzte Maut vor Split!", en: "Dugopolje toll — last toll before Split!" },
  },
  { id: "toll_ucka", lat: 45.308, lng: 14.172, radius: 3, type: "toll",
    name: { hr: "Tunel Učka", de: "Učka-Tunnel", en: "Učka tunnel" },
    card: { hr: "Tunel Učka — naplatna + tunel 5062m. Upali svjetla!", de: "Učka-Tunnel — Maut + 5062m Tunnel. Licht an!", en: "Učka tunnel — toll + 5062m tunnel. Lights on!" },
    segment_extra: { kamper: { hr: "Kamper: Učka tunel visina 4.5m — većina kampera prolazi, ali provjerite!", de: "Camper: Učka-Tunnel Höhe 4.5m — die meisten Camper passen, aber prüfen!" } },
  },

  // ═══ FERRY TERMINALS ═══
  { id: "ferry_split", lat: 43.505, lng: 16.439, radius: 2, type: "ferry",
    name: { hr: "Split trajektna luka", de: "Split Fährhafen", en: "Split ferry port" },
    card: { hr: "Split luka — trajekti za Brač, Hvar, Vis, Korčulu. Ukrcaj 1h ranije! Ljetni red: jadrolinija.hr", de: "Split Hafen — Fähren nach Brač, Hvar, Vis, Korčula. 1h vorher! Fahrplan: jadrolinija.hr", en: "Split port — ferries to Brač, Hvar, Vis, Korčula. Board 1h early! Schedule: jadrolinija.hr" },
  },
  { id: "ferry_jablanac", lat: 44.715, lng: 14.898, radius: 2, type: "ferry",
    name: { hr: "Jablanac → Mišnjak (Rab)", de: "Jablanac → Mišnjak (Rab)", en: "Jablanac → Mišnjak (Rab)" },
    card: { hr: "Trajekt za Rab! Ljeti red svaki sat. Subotom gužve — dođite 1-2h ranije.", de: "Fähre nach Rab! Im Sommer stündlich. Samstags Stau — 1-2h vorher kommen.", en: "Ferry to Rab! Hourly in summer. Saturday queues — arrive 1-2h early." },
  },
  { id: "ferry_prizna", lat: 44.916, lng: 14.868, radius: 2, type: "ferry",
    name: { hr: "Prizna → Žigljen (Pag)", de: "Prizna → Žigljen (Pag)", en: "Prizna → Žigljen (Pag)" },
    card: { hr: "Trajekt za Pag! Bura može otkazati! Alternativa: Paški most (besplatno).", de: "Fähre nach Pag! Bora kann absagen! Alternative: Pag-Brücke (kostenlos).", en: "Ferry to Pag! Bora can cancel! Alternative: Pag bridge (free)." },
  },

  // ═══ MAJOR CITIES (destination approach) ═══
  { id: "city_zagreb", lat: 45.815, lng: 15.982, radius: 8, type: "city",
    name: { hr: "Zagreb", de: "Zagreb", en: "Zagreb" },
    card: { hr: "Približavate se Zagrebu — ZET parking + tramvaj je isplativiji od centra!", de: "Annäherung an Zagreb — P+R + Tram ist günstiger als Zentrum!", en: "Approaching Zagreb — P+R + tram is cheaper than city center!" },
  },
  { id: "city_split", lat: 43.508, lng: 16.440, radius: 5, type: "city",
    name: { hr: "Split", de: "Split", en: "Split" },
    card: { hr: "Približavate se Splitu! Parking Sukoišan ili Kopilica — centar je kaos.", de: "Annäherung an Split! Parkplatz Sukoišan oder Kopilica — Zentrum ist Chaos.", en: "Approaching Split! Park at Sukoišan or Kopilica — center is chaos." },
    segment_extra: { kamper: { hr: "KAMPER: AutoCamp Stobreč 5km od centra — bus linija 60 do Rive", de: "CAMPER: AutoCamp Stobreč 5km vom Zentrum — Bus 60 zur Riva" } },
  },
  { id: "city_dubrovnik", lat: 42.650, lng: 18.094, radius: 5, type: "city",
    name: { hr: "Dubrovnik", de: "Dubrovnik", en: "Dubrovnik" },
    card: { hr: "Dubrovnik! NE vozite u Stari grad — parking Gruž ili Lapad pa bus/uber.", de: "Dubrovnik! NICHT in die Altstadt fahren — Parkplatz Gruž oder Lapad, dann Bus/Uber.", en: "Dubrovnik! Do NOT drive to Old Town — park at Gruž or Lapad, take bus/uber." },
    segment_extra: { kamper: { hr: "KAMPER: Kamp Solitudo (Babin Kuk) — jedini kamp blizu grada!", de: "CAMPER: Camp Solitudo (Babin Kuk) — einziger Campingplatz nahe der Stadt!" } },
  },
];

// Check which zones the current position is inside
export function checkZones(lat, lng, triggeredSet) {
  const results = [];
  for (const z of ZONES) {
    const dist = distKm(lat, lng, z.lat, z.lng);
    if (dist <= z.radius && !triggeredSet.has(z.id)) {
      results.push({ ...z, dist });
    }
  }
  return results;
}

// Check approach (warning before entering zone)
export function checkApproach(lat, lng, triggeredSet, approachKm = 15) {
  const results = [];
  for (const z of ZONES) {
    if (triggeredSet.has("approach_" + z.id)) continue;
    const dist = distKm(lat, lng, z.lat, z.lng);
    if (dist <= approachKm && dist > z.radius) {
      results.push({ ...z, dist, approaching: true });
    }
  }
  return results;
}

// Detect country from lat/lng (rough bounding boxes)
export function detectCountry(lat, lng) {
  if (lat > 46.37 && lng > 9.5 && lng < 17.2) return "AT";
  if (lat > 45.4 && lat < 46.9 && lng > 13.3 && lng < 16.6) return "SI";
  if (lat < 46.6 && lng > 13.0 && lng < 19.5) return "HR";
  return "EU";
}

// Auto-detect phase from position
export function detectPhase(lat, lng, destLat, destLng, homeLat, homeLng) {
  if (!destLat || !destLng) return null;
  const toDest = distKm(lat, lng, destLat, destLng);
  const toHome = homeLat ? distKm(lat, lng, homeLat, homeLng) : 999;
  if (toDest < 2) return "odmor";        // arrived
  if (toHome < 5) return "landing";       // still home
  if (toDest < 200) return "transit";     // on the way (< 200km)
  return "transit";                        // far from destination (>= 200km)
}
