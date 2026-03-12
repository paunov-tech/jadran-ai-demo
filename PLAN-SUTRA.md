# JADRAN.AI — Plan za sutra (13.03.2026)

## Backup potvrda
- **Tag:** `v2.0-session4-final` (142 commita)
- **Prethodni tag:** `v1.0-landing-final` (landing zaključan)
- **Repo:** github.com/paunov-tech/jadran-ai-demo
- **Live:** jadran.ai / jadran-ai-demo.vercel.app

---

## Trenutni status: SPREMAN ZA REKLAMU

### Funkcionalno ✅
- AI Chat radi (Sonnet 4, temperature 0.4)
- 4 niše: Kamper / Lokalni / Nautika / Kruzer
- DHMZ NAVTEX za nautičare
- Jadran Lens (📷 kamera)
- Walkie-Talkie (📻 hands-free)
- 10 poruka besplatno → Paywall
- Stripe LIVE: 4.99€/tjedan, 9.99€/sezona
- Post-purchase potvrda
- 31 GYG + 7 Booking affiliate linkovi (svi ispravni)
- 8 jezika (uklj. AT Kärntner dijalekt)
- AI guardrails (off-topic + ton konciježa)

### Vizualno ✅
- Landing: foto tabovi, video hero, demo, destinacije, trending
- Setup: foto hero kartica (zlatni sjaj), social proof, auto-start
- Chat: Vibe dashboard, NAVTEX, mini bar
- Footer: Stripe badge
- Mobile: touch radi, responsive, safe-area

---

## PLAN ZA SUTRA — REKLAMNA KAMPANJA

### Jutro (9:00-10:00) — Provjera
1. **Test sva 4 toka** na mobilnom (incognito):
   - Landing → Kamper → Istra → Chat (10 poruka → paywall)
   - Landing → Nautika → Split → Chat (NAVTEX vidljiv)
   - Landing → Kruzer → Dubrovnik → Chat
   - Landing → Lokalni → Kvarner → Chat
2. **Test plaćanje** (Stripe test kartica 4242 4242 4242 4242)
3. **Test guardrails** ("Kako promijeniti ulje?" + "LUDILOOO 🥳🥳")

### Jutro (10:00-11:00) — Analytics
4. **Dodaj Google Analytics / Plausible** (mjerenje konverzija)
   - Events: page_view, chat_start, msg_sent, paywall_shown, checkout_click, payment_success
   - Funnel: Landing → Setup → Chat → Paywall → Payment

### Podne (11:00-13:00) — Ad setup
5. **Facebook/Instagram Ads:**
   - Audience: DE + AT + EN, 25-55, interests: camping, sailing, Croatia vacation
   - Creative: screenshot landing + "Dein Adria-Guide ab 4,99€"
   - Budget: 20€/dan test
   - Landing: jadran.ai (auto-detect language)

6. **Google Ads:**
   - Keywords: "Croatia camper route", "Adriatic sailing guide", "Dubrovnik cruise what to do"
   - Landing: jadran.ai/ai?niche=camper (deep link po niši)

### Popodne — Monitoring
7. **Pratiti:**
   - Vercel Analytics (traffic)
   - Stripe Dashboard (prihodi)
   - /api/health (API zdravlje)
   - Console errors u browseru

---

## PRIORITETI PRVE SEDMICE

| Prioritet | Zadatak | Razlog |
|-----------|---------|--------|
| 🔴 P0 | Rate limiting na API | Sprječava abuse/DDoS |
| 🔴 P0 | Error monitoring (Sentry) | Hvata JS errors u produkciji |
| 🟡 P1 | Analytics events | Mjerenje konverzijskog funela |
| 🟡 P1 | A/B test cijena (4.99 vs 6.99) | Optimizacija revenue |
| 🟢 P2 | Više B2B partnera | Konobe, kampovi u bazi |
| 🟢 P2 | Admin dashboard | Revenue + usage pregled |
| 🟢 P2 | Web Push (VAPID) | Notifikacije za zatvorene tabove |

---

## POZNATI ISSUES (ne blokiraju launch)
- App.jsx ima stale 5.99€ cijene (NEVER MODIFY policy)
- Viator template definiran ali nekorišten (budući partner)
- Service Worker u self-destruct modu (namjerno)
- Nema rate limitinga (dodati P0 prvu sedmicu)
