# JADRAN.AI — Session Handover
**Datum:** 2026-03-27 | **Sesija:** Sprint 7 + post-deploy fixes  
**Repo:** `paunov-tech/jadran-ai-demo` | **Live:** jadran.ai  
**Stack:** React 19 + Vite, Vercel serverless, Claude Haiku, Gemini, Stripe, Firebase

---

## Stanje na kraju sesije

### Git log (posljednjih 15 commita)
```
0aef01e fix: AI trial for QR guests — all 3 kiosk entry paths covered
07a787a feat: AI trial for QR guests — activates on kiosk entry after onboarding
85f2ab5 fix: AI trial triggers on 'Start trip' not booking confirmation
724d5c7 feat: AI Guide as primary CTA + 24h free trial after booking
7c83d22 fix: GuestOnboarding only for real room codes, not standalone dev_ users
1341f05 fix: disable Pre-Trip nav when in kiosk/post phase
5430b77 fix: restore TransitMap, LiveTicker, RouteGuide — deleted in refactor
3f91cb5 fix: mapToCity hardcoded 'Split' — use DELTA destination or kioskCity
79d1baa fix: chat input loses focus on keypress — inline component calls vs JSX usage
401db28 fix: broken JSX tags after hover cleanup + build verified clean
9cc5bee design: visual overhaul — ui.jsx v2, GLOBAL_CSS, upgraded components
f064e58 refactor: split 3517-line App.jsx into 3 logical layers
1f54aed feat: Sprint 7A/7B/7C — dehardcode, dates lifecycle hook, unified DELTA, Rab content
7ec6c4b Fix kiosk AI chat: remove nearbyHighlights scope bug, free chat tile, auto-premium
b3b9ee4 Fix tourist email + goToTrip → TripGuide + Black Jack rich card
```

### Build status
- ✅ Build čist: 59 modula, ~6s
- ✅ Pushano na GitHub → Vercel auto-deploya
- ✅ Live na jadran.ai

---

## Arhitektura — 3 fajla

| Fajl | Linije | Sadržaj |
|---|---|---|
| `src/App.jsx` | 3060 | Sva React logika, state, komponente |
| `src/data.js` | 468 | Sve konstante: GEMS, EXPERIENCES, ACCOMMODATION, T translations, GYG/VIA/BKG helpers |
| `src/ui.jsx` | 402 | Design sistem: makeTheme, GLOBAL_CSS, Badge, Btn, Card, SectionLabel, BackBtn, Icon, IC |

---

## Dva user flow-a

### Flow 1 — Samostalni gost (B2C)
```
jadran.ai (LandingPage)
  → Odabir transporta + datumi dolaska/povratka
  → Klik "Krećem na put" → startTrip() → AI trial 72h
  → App.jsx /?room=DEMO kiosk
```

### Flow 2 — Gost via QR (B2B2C)
```
jadran.ai/explore (DestinationExplorer)
  → Srđan/partner kreira booking → JAD-ID → email gostu
  → Gost skenira QR: jadran.ai/?room=XXXX
  → GuestOnboarding (ime, interesi) → AI trial 72h
  → Kiosk
```

---

## AI Trial sistem

**Filozofija:** Gost mora koristiti AI TOKOM puta i na destinaciji — ne tjedan dana
od rezervacije kad sve zaboravi.

| Trigger | Kada | Trial |
|---|---|---|
| `startTrip()` | Klikne "Krećem na put" | 72h |
| `GuestOnboarding` complete → kiosk | Prvi dolazak QR gosta | 72h |
| `loadGuest` → `autoPhase=kiosk` | Povratak QR gosta | 72h (ne resetuje aktivni) |
| `?kiosk=rab` tablet demo | Direktni kiosk URL | - (nema trial, nije flow) |
| Page reload | - | Restore iz `jadran_ai_trial_until` |

**localStorage ključevi:**
```
jadran_ai_premium       "1" = plaćen premium (ne ističe)
jadran_ai_trial_until   timestamp = trial ističe tada
jadran_delta_context    JSON DELTA state (segment, from, dest, datumi)
jadran_push_deviceId    deviceId za standalone korisnike
jadran_trip_paid        {JAD-ID: true} — plaćene TripGuide rezervacije
jadran_viator_wishlist  JSON array wishlistanih aktivnosti
jadran_go_transit       "1" — flag za transit handoff
```

---

## UX promjene ove sesije

### KioskHome — AI na prvom mjestu
- AI Guide je **full-width banner iznad grida** (ljubičasti, sa strelicom)
- Grid ima 10 servisnih tile-ova (parking, plaže, hrana...) — bez AI tile-a
- AI banner: direktan klik → `setSubScreen("chat")`

### PhaseNav — lock backwards
- Pre-Trip tab je **zaključan** (siv, `opacity: 0.35`, `pointerEvents: none`)
  čim gost uđe u kiosk ili post-stay fazu
- Sprječava navigation bugs iz Podstrana-split mix-a

### Chat input fix
- `<KioskChat />` → `KioskChat()` (i sve ostale kiosk pod-komponente)
- Problem: svaki `setChatInput` keystroke = re-render = nova referenca = unmount input = gubi fokus
- Fix: function calls umjesto JSX, React reconcilira po poziciji

### TransitMap/RouteGuide restore
- Slučajno izbrisani tokom refaktora (bili u istom bloku s data konstantama)
- Vraćeni iz `git show 7ec6c4b:src/App.jsx`

---

## Pending / TODO

### Visoki prioritet
- [ ] **AI trial expiry notice** — "Vaš AI pristup ističe za 4h, produži za 9.99€"
  - Provjeriti `jadran_ai_trial_until` pri svakom renderu kioskHome
  - Prikazati banner kad ostane <12h
  - CTA → Paywall

- [ ] **Geofence nije dinamičan** — `PRODUCTION_TODO.md` #1
  - `const DEST = { lat: 43.4892, lng: 16.5523 }` hardcoded Podstrana
  - Fix: `loadDelta().destination` coords

- [ ] **Weather API bez koordinata** — `PRODUCTION_TODO.md` #2
  - `fetch("/api/weather")` → treba `?lat=X&lon=Y`

### Srednji prioritet
- [ ] **Viator search nije location-aware**
  - Šalje default Split, ignorira kioskCity
  
- [ ] **Chat history persistence** (Firestore, premium only)
  - Djelimično implementirano, nedovršeno

- [ ] **Booking.com na kiosku koristi kioskCity**
  - `PRODUCTION_TODO.md` #13 — treba `kioskCity` umjesto hardcoded

### Nizak prioritet
- [ ] **n8n agent R01** (Komercijalista) — ~90% kompletan
- [ ] **Gmail→Drive integracija** za ANVIL
- [ ] **Resend.com** za R02 (TDS Bibliotekar)

---

## Deployment

```bash
# Normalan deploy (auto-trigger pri git push):
git push origin main
# Vercel auto-deploya za ~60-90s

# Manualni deploy (ako treba):
vercel --prod

# Token za push (čuva se lokalno, ne u repo):
git remote set-url origin https://paunov-tech:TOKEN@github.com/paunov-tech/jadran-ai-demo.git
git push origin main
git remote set-url origin https://github.com/paunov-tech/jadran-ai-demo.git
```

---

## Ključne URL-ove

| URL | Šta je |
|---|---|
| `jadran.ai` | LandingPage — B2C marketing + transit onboarding |
| `jadran.ai/explore` | DestinationExplorer — B2B operator flow |
| `jadran.ai/?room=XXXX` | QR kiosk — gost skenira QR na vraima |
| `jadran.ai/?kiosk=rab` | Tablet demo — Srđanov tablet na Rabu |
| `jadran.ai/?kiosk=rab&lang=de` | Tablet demo — njemački jezik |
| `jadran.ai/host` | HostPanel — PIN: jadran2026 |
| `jadran.ai/ai` | StandaloneAI — pay-and-use |
| `jadran.ai/?room=DEMO&go=transit&from=München&to=Rab&seg=auto` | Transit demo |

---

## Promo kodovi
- `CALDERYS2026` — VIP do kraja 2026
- `JADRANTEST` — VIP do juna 2026

## Affiliate partneri
- GetYourGuide: `partner_id=9OEGOYI`
- Viator: `P00292197`
- Booking.com: `aid=101704203`

## Direktni partner
- **Black Jack Rab** — `booking@blackjackrab.com`
- `?affiliate=blackjack` — prikazuje full property card

---

## Poznati bugovi (ne blokiraju produkciju)

1. **iOS hub grid 1 kolona** umjesto 2 — CSS `auto-fill` issue
2. **Command Palette odsječen** na mobilnom — overflow
3. **CommercialSync ne pulla** na mobilnom — ANVIL, ne Jadran
4. Firefox `-moz-osx-font-smoothing` warning — harmless
5. HERE Maps WASM source map warning — harmless

