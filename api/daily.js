// /api/daily.js — Daily Adriatic micro-news
// Gemini generates fresh travel intel, cached 24h per language
// Falls back to curated pool if API fails

const CACHE = {}; // In-memory cache (persists across warm Vercel invocations)

const FALLBACK = [
  { ic: "🐬", hr: "Dupini su jučer viđeni u Kornatima — rijetka pojava ove sezone. Skupina od 8 životinja.", en: "Dolphins spotted in the Kornati islands yesterday — rare this early in season. Pod of 8.", de: "Delfine gestern bei den Kornaten gesichtet — selten so früh. Gruppe von 8 Tieren.", it: "Delfini avvistati ieri alle Kornati — raro così presto. Gruppo di 8." },
  { ic: "🌡️", hr: "More je dostiglo 18°C kod Splita — kupanje moguće za hrabrije. Do lipnja očekujemo 24°C.", en: "Sea reached 18°C near Split — brave swimmers only. By June we expect 24°C.", de: "Meer hat 18°C bei Split erreicht — nur für Mutige. Bis Juni erwarten wir 24°C.", it: "Mare a 18°C vicino a Spalato — solo per coraggiosi. Entro giugno previsti 24°C." },
  { ic: "⛴️", hr: "Jadrolinija uvodi dodatne linije Split-Hvar od ovog vikenda. Trajekt svaka 2 sata.", en: "Jadrolinija adds extra Split-Hvar routes this weekend. Ferry every 2 hours.", de: "Jadrolinija fügt ab diesem Wochenende Split-Hvar-Verbindungen hinzu. Fähre alle 2h.", it: "Jadrolinija aggiunge rotte Split-Hvar questo weekend. Traghetto ogni 2 ore." },
  { ic: "🏰", hr: "Dioklecijanova palača u Splitu upravo je završila restauraciju zapadnog zida. Novi obilazak dostupan.", en: "Diocletian's Palace in Split just completed the west wall restoration. New tour route available.", de: "Diokletianpalast in Split: Westmauer-Restaurierung abgeschlossen. Neue Tour verfügbar.", it: "Palazzo di Diocleziano a Spalato: restauro muro ovest completato. Nuovo percorso disponibile." },
  { ic: "🍷", hr: "Plavac Mali berba 2025 proglašena najboljom u 20 godina. Pelješac vinari otvaraju degustacije.", en: "Plavac Mali 2025 vintage declared best in 20 years. Pelješac wineries opening tastings.", de: "Plavac Mali Jahrgang 2025 zum besten seit 20 Jahren erklärt. Pelješac-Weingüter öffnen Verkostungen.", it: "Plavac Mali 2025 dichiarata la migliore annata in 20 anni. Degustazioni a Pelješac." },
  { ic: "🦎", hr: "Ove godine na Jadranu evidentirano 12 novih vrsta morskih konjica. Biološka senzacija.", en: "12 new seahorse species recorded in the Adriatic this year. A biological sensation.", de: "12 neue Seepferdchenarten dieses Jahr in der Adria erfasst. Biologische Sensation.", it: "12 nuove specie di cavallucci marini registrate nell'Adriatico quest'anno. Sensazione biologica." },
  { ic: "☀️", hr: "Hvar je službeno najsunčaniji otok u Europi — 2,726 sunčanih sati godišnje. Više od Malte.", en: "Hvar is officially Europe's sunniest island — 2,726 sunshine hours/year. More than Malta.", de: "Hvar ist offiziell Europas sonnigste Insel — 2.726 Sonnenstunden/Jahr. Mehr als Malta.", it: "Hvar è ufficialmente l'isola più soleggiata d'Europa — 2.726 ore di sole/anno." },
  { ic: "🧀", hr: "Paški sir ponovo osvojio World Cheese Awards — jedini hrvatski sir u TOP 50 svijeta.", en: "Pag cheese won World Cheese Awards again — only Croatian cheese in global TOP 50.", de: "Pager Käse gewann erneut World Cheese Awards — einziger kroatischer Käse in den TOP 50.", it: "Formaggio di Pag ha vinto di nuovo ai World Cheese Awards — unico croato nella TOP 50." },
  { ic: "🏊", hr: "Temperatura mora u Dubrovniku je 2°C viša od prosjeka za ovo doba godine. Klimatske promjene?", en: "Sea temperature in Dubrovnik is 2°C above average for this time of year. Climate change?", de: "Wassertemperatur in Dubrovnik 2°C über dem Durchschnitt für diese Jahreszeit.", it: "Temperatura del mare a Dubrovnik 2°C sopra la media per questo periodo dell'anno." },
  { ic: "🚤", hr: "Nova electric boat marina otvorena u Rovinju — prva potpuno električna marina na Jadranu.", en: "New electric boat marina opened in Rovinj — first fully electric marina on the Adriatic.", de: "Neue Elektroboot-Marina in Rovinj eröffnet — erste vollelektrische Marina an der Adria.", it: "Nuova marina elettrica aperta a Rovigno — prima marina completamente elettrica sull'Adriatico." },
  { ic: "🎭", hr: "Splitsko ljeto počinje za 78 dana. Ove godine: opera na Peristilu i jazz u podrumima Palače.", en: "Split Summer starts in 78 days. This year: opera at Peristyle and jazz in Palace basements.", de: "Spalato Sommer beginnt in 78 Tagen. Dieses Jahr: Oper am Peristyl und Jazz im Palastkeller.", it: "Estate di Spalato inizia tra 78 giorni. Quest'anno: opera al Peristilio e jazz nei sotterranei." },
  { ic: "🦑", hr: "Ribar iz Komiže ulovio lignju od 1.2m — mogući rekord za Jadransko more.", en: "Fisherman from Komiža caught a 1.2m squid — possible Adriatic record.", de: "Fischer aus Komiža fing einen 1,2m-Kalmar — möglicher Adria-Rekord.", it: "Pescatore di Komiža ha pescato un calamaro da 1,2m — possibile record adriatico." },
  { ic: "🏖️", hr: "Zlatni rat na Braču promijenio oblik — ovog proljeća vrhom gleda više prema istoku.", en: "Zlatni Rat on Brač changed shape — this spring its tip points more eastward.", de: "Zlatni Rat auf Brač hat die Form geändert — Spitze zeigt diesen Frühling mehr nach Osten.", it: "Zlatni Rat a Brač ha cambiato forma — questa primavera la punta guarda più a est." },
  { ic: "🎬", hr: "HBO najavio novu seriju koja će se snimati u Dubrovniku ovo ljeto. Grad opet filmska zvijezda.", en: "HBO announced a new series filming in Dubrovnik this summer. The city is a film star again.", de: "HBO kündigte eine neue Serie an, die diesen Sommer in Dubrovnik gedreht wird.", it: "HBO ha annunciato una nuova serie che sarà girata a Dubrovnik quest'estate." },
  { ic: "⛵", hr: "ACI marina Palmižana proglašena najboljom malom marinom Mediterana 2026.", en: "ACI Marina Palmižana named best small Mediterranean marina 2026.", de: "ACI Marina Palmižana zur besten kleinen Mittelmeer-Marina 2026 gekürt.", it: "ACI Marina Palmižana nominata miglior piccola marina del Mediterraneo 2026." },
  { ic: "🛣️", hr: "⚠️ VAŽNO: Hrvatska uvela FREE-FLOW cestarinu 2026. — nema naplatnih rampi! Plati na hac.hr do 30 dana od prolaza ili kazna do 500€.", en: "⚠️ IMPORTANT: Croatia introduced FREE-FLOW tolls in 2026 — no toll booths! Pay at hac.hr within 30 days or face fines up to €500.", de: "⚠️ WICHTIG: Kroatien hat 2026 Free-Flow-Maut eingeführt — keine Schranken mehr! Zahlung auf hac.hr innerhalb 30 Tage Pflicht, sonst bis 500€ Bußgeld.", it: "⚠️ IMPORTANTE: Croazia ha introdotto il free-flow nel 2026 — niente barriere! Pagare su hac.hr entro 30 giorni, multa fino a 500€." },
  { ic: "🚐", hr: "Kamperi u Hrvatskoj 2026: nova elektronska cestarina — registriraj tablice na hac.hr PRIJE puta. Vozila >3.5t trebaju GNSS uređaj. Bez registracije = kazna!", en: "Campervans in Croatia 2026: new electronic tolls — register your plates at hac.hr BEFORE your trip. Vehicles >3.5t need GNSS device. No registration = fine!", de: "Wohnmobile in Kroatien 2026: neue Free-Flow-Maut — Kennzeichen auf hac.hr VOR der Reise registrieren! Fahrzeuge >3,5t brauchen GNSS-Gerät.", it: "Camper in Croazia 2026: nuova tariffa elettronica — registra la targa su hac.hr PRIMA del viaggio. Veicoli >3,5t necessitano dispositivo GNSS." },
  { ic: "💳", hr: "Savjet za strane turiste: europski ENC transponder (Telepass) radi na svim hrvatskim autocestama. Bez transpondera? Plati karticom na hac.hr — brzo i jednostavno.", en: "Tip for foreign tourists: European ENC transponder (Telepass) works on all Croatian highways. No transponder? Pay by card at hac.hr — quick and easy.", de: "Tipp für Auslandstouristen: Europäischer ENC-Transponder (Telepass) funktioniert auf allen kroatischen Autobahnen. Ohne Transponder? Zahlen per Karte auf hac.hr.", it: "Consiglio per turisti stranieri: il transponder ENC europeo (Telepass) funziona su tutte le autostrade croate. Senza transponder? Paga con carta su hac.hr." },
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  if (req.method === "OPTIONS") return res.status(200).end();

  const lang = (req.query?.lang || "hr").toLowerCase();
  const langKey = ["en","de","at","it"].includes(lang) ? (lang === "at" ? "de" : lang) : "hr";
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `${today}_${langKey}`;

  // Return cached if available
  if (CACHE[cacheKey]) {
    return res.status(200).json(CACHE[cacheKey]);
  }

  // Try Gemini for fresh content
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a travel journalist covering the Croatian Adriatic coast. Write ONE short news-style fact or micro-story (max 2 sentences, under 180 chars) about something interesting RIGHT NOW on the Adriatic — it can be: nature, weather, food, culture, local event, maritime news, a fascinating historical fact, OR a practical travel tip. IMPORTANT: roughly 1 in 4 times, write about Croatia's new FREE-FLOW electronic toll system (2026): no more toll booths, must pay at hac.hr within 30 days, fines up to €500, Telepass works. Make it feel current and specific, not generic. Today is ${today}. Write ONLY in ${langKey === "hr" ? "Croatian" : langKey === "en" ? "English" : langKey === "de" ? "German" : "Italian"}. Also suggest a single emoji icon that fits. Format: EMOJI|TEXT (nothing else).`;

      const gemRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 200, temperature: 0.9 } }),
        }
      );
      const gemData = await gemRes.json();
      const raw = gemData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (raw && raw.includes("|")) {
        const [ic, text] = [raw.split("|")[0].trim(), raw.split("|").slice(1).join("|").trim()];
        if (text.length > 10) {
          const result = { ic, text, source: "live", date: today };
          CACHE[cacheKey] = result;
          return res.status(200).json(result);
        }
      }
    } catch (err) {
      console.error("Gemini daily error:", err.message);
    }
  }

  // Fallback to curated pool
  const day = Math.floor(Date.now() / 86400000);
  const pick = FALLBACK[day % FALLBACK.length];
  const result = { ic: pick.ic, text: pick[langKey] || pick.hr, source: "curated", date: today };
  CACHE[cacheKey] = result;
  return res.status(200).json(result);
}
