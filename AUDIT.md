# JADRAN.AI — ZAVRŠNI AUDIT
## 12.03.2026 · 124 commita · v1.0-landing-final

---

## ✅ PRODUKCIJSKI STATUS: SPREMAN ZA REKLAMU

---

## 1. MONETIZACIJA

### Direktna naplata (Stripe LIVE)
| Plan | Cijena | Trajanje | Regije |
|------|--------|----------|--------|
| Tjedan | 3.99€ | 7 dana | 1 regija |
| Sezona | 7.99€ | 30 dana | sve regije |

- ✅ Stripe Checkout sesija sa success/cancel URL
- ✅ Webhook (checkout.session.completed) + signature verification
- ✅ localStorage premium state sa auto-expire
- ✅ 24h besplatni trial (timestamp-based)
- ✅ Paywall modal prevedena na 8 jezika
- ✅ Trust badge: 🛡️ Stripe u footeru
- ✅ Podržano: Visa, Mastercard, Apple Pay, Google Pay (via Stripe)

### Affiliate prihodi (3 partnera)
| Partner | ID | Tip |
|---------|-----|-----|
| GetYourGuide | 9OEGOYI | 24 aktivnosti, 6 regija |
| Viator | P00292197 | Ture |
| Booking.com | 101704203 | 8 destinacija + 6 regija |

- ✅ Realni linkovi injektirani u AI prompt (ne halucinira URL-ove)
- ✅ Full-width 56px affiliate dugmad u chatu
- ✅ Destination kartice → Booking.com
- ✅ Trending karusel → GYG

### Monetizacijski tokovi
```
Besplatan korisnik (24h):
  └→ Chat besplatno → Affiliate klik → GYG/Viator/Booking provizija
  └→ Trial istekao → Paywall → Stripe 3.99/7.99€

Premium korisnik:
  └→ Neograničen chat → Više affiliate klikova
  └→ Otključan Deep Local intel → Više engagement-a
  └→ Returning user follow-up → "Jutro posle" affiliate

B2B:
  └→ Host Panel → QR kod za goste → Volume korisnika
```

---

## 2. KORISNIČKO ISKUSTVO (4 NIŠE)

### 🚐 Kamper vodič
- Setup: GABARITI VOZILA picker (dužina + visina)
- AI: "Jadran Camping Expert" — safety-first, parking, dump station
- Dimenzije → prompt: tunel visina, parking dužina, trajekt kategorija
- 10 camper upozorenja (critical/high/medium)
- Istra Insider (7 sezonskih stavki)
- Kvarner Deep Local (10 stavki)
- Quick chips: Parking? / Večera? / Benzinska?

### 🚗 Lokalni vodič
- Za apartman, hotel ili automobilom
- AI: parking cijene, alternativni putevi, plaže s pristupom
- Quick chips: Plaža? / Ručak? / Što posjetiti?

### ⛵ Nautički vodič
- AI: "Adriatic Skipper Pro" — nautički jezik, sigurnost
- 11 marina (vezovi, max dužina, cijena/m, gorivo, VHF)
- 7 sidrišta (dubina, dno, zaštita od vjetra)
- Jugo/Bura/Neverin pravila
- Quick chips: Marina? / Stanje mora? / Konoba s mora?

### 🚢 Kruzer vodič
- AI: "Shore Excursion Time-Master" — plan po minutu
- 4 lučka profila (Split, Dubrovnik, Zadar, Kotor)
- Golden Question: "All Aboard time?"
- Skip-the-line monetizacija
- Pile Gate hack (Dubrovnik)
- Quick chips: Plan 8h? / Ručak? / Fotogenična lokacija?

---

## 3. VIBE JADRANA — LIVE POMORSKI DASHBOARD

- ✅ 6 regijskih koordinata (Split, Makarska, Dubrovnik, Zadar, Istra, Kvarner)
- ✅ Auto-refresh svaki 60 sekundi
- ✅ Zeleni LIVE indikator + lokacija + timestamp
- ✅ Kartice: Stanje mora, Vjetar (Bura/Jugo/Maestral), Temperatura, UV, Barometar
- ✅ Jadransko ime vjetra + Beaufort skala
- ✅ Temperatura mora + preporuka za kupanje
- ✅ Upozorenje banner (vjetar >35, more ≥4, UV ≥9)
- ✅ Browser notification za opasne uvjete

---

## 4. SPECIJALNE FUNKCIJE

### 📸 Jadran Lens (AI Kamera)
- 📷 dugme u input baru
- HTML5 capture="environment" (zadnja kamera)
- Canvas kompresija 1024×1024 JPEG 0.8
- Gemini 2.0 Flash multimodal
- Kontekst: regija + mod + dimenzije kampera
- 6 analiza: jelovnik, natpis, red vožnje, lokacija, cjenik, proizvod

### 📻 Walkie-Talkie (Hands-Free)
- 120×120px PTT dugme
- Web Speech API (8 jezika)
- Screen Wake Lock (ekran ne gasi se)
- SpeechSynthesis TTS (čita odgovor naglas)
- Auto-send u walkie modu
- Backend: max_tokens 200, ultra-kratki odgovori

### 🔔 Weather Alerts
- Browser Notification API
- Trigger svaki 60s: vjetar >35, more ≥4, UV ≥9, tlak <1005
- Dedup (ista poruka se ne ponavlja)

### 🕐 Returning User (Open Tab)
- 3 scenarija: Jutro posle / Kasno popodne / Spremanje za pokret
- Detekcija: localStorage timestamp, 4h+ pauza
- Visit counter za Scenario 3

---

## 5. PREVODIOČKI AUDIT

### Landing Page (5 jezika)
| Ključ | HR | DE | AT | EN | IT |
|-------|----|----|----|----|-----|
| 4 taba | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hero h1 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pain relief | ✅ | ✅ | ✅ | ✅ | ✅ |
| Demo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Destinacije | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trending | ✅ | ✅ | ✅ | ✅ | ✅ |
| B2B | ✅ | ✅ | ✅ | ✅ | ✅ |

### Chat App (8 jezika)
| Ključ | HR | EN | DE | IT | AT | SI | CZ | PL |
|-------|----|----|----|----|----|----|----|----|
| Setup UI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Niche titles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quick chips | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paywall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Walkie-talkie | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Error msgs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vibe headers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Button labels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### AT vs DE razlikovanje
- AT: du-Form, "Beisl", "Schmankerln", "gschmackige Jause", "Los geht's!", "I hör zu..."
- DE: Sie-Form, "Restaurant", "Freischalten", "Gespräch starten"

---

## 6. SIGURNOSNI STATUS

| Provjera | Status | Napomena |
|----------|--------|----------|
| API ključevi | ✅ SAFE | Samo u process.env (Vercel) |
| Firebase config | ⚠️ OK | Javni ključ, ali ograničen na domenu |
| Stripe webhook | ✅ | constructEvent sa signature |
| CORS | ⚠️ | Allow-Origin: * (prihvatljivo za MVP) |
| XSS | ✅ | React auto-escape + nema dangerouslySetInnerHTML |
| Rate limiting | ❌ TODO | Nema — dodati za produkciju |
| Input validation | ⚠️ | Minimalna — API prihvata svaki string |
| HTTPS | ✅ | Vercel enforces HTTPS |

---

## 7. TEHNIČKE METRIKE

| Metrika | Vrijednost |
|---------|-----------|
| Ukupno LOC | 6,133 |
| Commita | 124 |
| API endpointa | 10 |
| Bundle (gzip) | ~243 KB total |
| StandaloneAI | 33 KB gzip |
| Landing | 10 KB gzip |
| Firebase (vendor) | 86 KB gzip |
| Prompt token savings | ~60-70% (Lego routing) |
| API temperature | 0.4 (low hallucination) |
| Walkie max_tokens | 200 (ultra-short) |

---

## 8. ARHITEKTURA

```
jadran.ai (Landing)
  ├→ /ai?niche=camper  → Kamper setup → Chat
  ├→ /ai?niche=local   → Lokalni setup → Chat
  ├→ /ai?niche=sailing  → Nautika setup → Chat
  ├→ /ai?niche=cruiser  → Kruzer setup → Chat
  └→ /host             → Host Panel (QR, apartmani)

Backend:
  api/chat.js          → Claude Sonnet 4 (Lego prompt routing)
  api/promptBuilder.js → [BASE] + [MODE] + [LOCATION] + [LINKS]
  api/weather.js       → Open-Meteo (per-region coords, 60s)
  api/vision.js        → Gemini 2.0 Flash (multimodal)
  api/checkout.js      → Stripe (3.99€ / 7.99€)
  api/webhook.js       → Stripe webhook
  api/cityimg.js       → Wikipedia images
```

---

## 9. PREPORUKE PRIJE REKLAME

### Kritično (prije reklame):
- [x] Svi prevodi kompletni
- [x] Paywall funkcionalan
- [x] Affiliate linkovi realni
- [x] Stripe LIVE
- [x] Zero self-referencing translation bugs

### Preporučeno (prva sedmica):
- [ ] Rate limiting na API (sprječava abuse)
- [ ] Google Analytics / Plausible (tracking konverzija)
- [ ] Error monitoring (Sentry)
- [ ] A/B test cijena (3.99 vs 4.99)

### Kasnije:
- [ ] Web Push (VAPID) za zatvorene tabove
- [ ] Admin dashboard (revenue, usage)
- [ ] Lighthouse 90+ audit
- [ ] Više B2B partnera (konobe, kampovi)

---

**ZAKLJUČAK: Aplikacija je spremna za reklamnu kampanju.**
