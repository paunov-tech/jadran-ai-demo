// src/deltaContext.js — DELTA_CONTEXT persistence + schema
// Shared between LandingPage (writes) and App (reads + updates)

const STORAGE_KEY = "jadran_delta_context";

export const SEGMENTS = {
  kamper:     { icon: "🚐", label: { hr: "Kamperi", de: "Camper", en: "Campers", it: "Camperisti", si: "Kamperji", cz: "Obytňáky", pl: "Kamperzyści" } },
  porodica:   { icon: "👨‍👩‍👧", label: { hr: "Porodice", de: "Familien", en: "Families", it: "Famiglie", si: "Družine", cz: "Rodiny", pl: "Rodziny" } },
  par:        { icon: "💑", label: { hr: "Parovi", de: "Paare", en: "Couples", it: "Coppie", si: "Pari", cz: "Páry", pl: "Pary" } },
  jedrilicar: { icon: "⛵", label: { hr: "Nautičari", de: "Segler", en: "Sailors", it: "Velisti", si: "Jadralci", cz: "Jachtaři", pl: "Żeglarze" } },
};

export const DEFAULTS = {
  segment: null,          // "kamper" | "porodica" | "par" | "jedrilicar"
  transport: null,        // "auto" | "kamper" | "avion" | "odmor"
  from: null,             // departure city name
  from_coords: null,      // [lat, lng]
  destination: null,      // { city, lat, lng, region }
  travelers: { adults: 2, kids: 0, kids_ages: [] },
  arrival_date: null,     // ISO date string
  budget: null,           // "low" | "mid" | "high"
  interests: [],          // array of interest keys
  room_code: null,
  phase: "landing",       // landing|transit|odmor|povratak
};

export function loadDelta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveDelta(partial) {
  try {
    const current = loadDelta();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (import.meta.env.DEV) window.__DELTA = updated;
    return updated;
  } catch {
    return { ...DEFAULTS, ...partial };
  }
}

export function clearDelta() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  if (import.meta.env.DEV) window.__DELTA = null;
}

// Chat prompt block — injected into system prompt
export function deltaPromptBlock(delta) {
  if (!delta || !delta.segment) return "";
  const lines = ["[DELTA KONTEKST — personalizirani profil gosta]"];
  if (delta.segment) lines.push(`Segment: ${delta.segment}`);
  if (delta.transport) lines.push(`Transport: ${delta.transport}`);
  if (delta.from) lines.push(`Polazište: ${delta.from}`);
  if (delta.destination?.city) lines.push(`Destinacija: ${delta.destination.city}`);
  const t = delta.travelers;
  if (t) lines.push(`Putnici: ${t.adults} odraslih${t.kids > 0 ? `, ${t.kids} djece (${(t.kids_ages ?? t.kidsAges ?? []).join(", ")} god)` : ""}`);
  if (delta.arrival_date) lines.push(`Dolazak: ${delta.arrival_date}`);
  if (delta.budget) lines.push(`Budget: ${delta.budget}`);
  if (delta.interests?.length) lines.push(`Interesi: ${delta.interests.join(", ")}`);
  
  lines.push("\nPRAVILA:");
  if (delta.segment === "kamper") {
    lines.push("- Prioritet: parking, visine tunela, dump stanice, LPG, bura upozorenja");
    lines.push("- Ton: praktičan kamper iskusnjak");
  } else if (delta.segment === "porodica") {
    lines.push("- Prioritet: WC pauze na ruti, dječje plaže, obiteljski restorani, sigurnost");
    lines.push("- Ton: prijateljski, strpljiv, kid-friendly savjeti");
  } else if (delta.segment === "par") {
    lines.push("- Prioritet: romantične lokacije, vinarije, restorani za dvoje, viewpointi");
    lines.push("- Ton: elegantan, insajderski, premium preporuke");
  } else if (delta.segment === "jedrilicar") {
    lines.push("- Prioritet: marine, sidrišta, vjetar, dubine, VHF kanali, gorivo");
    lines.push("- Ton: nautički stručan, pomorska terminologija");
  }
  return lines.join("\n");
}
