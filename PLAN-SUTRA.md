# JADRAN.AI — Plan za 13.03.2026 (četvrtak)

## Status: PRODUCTION READY
- Tag: `v2.0-session4-final` · 150 commita · 21/21 testova PASS
- Live: jadran.ai

---

## JUTRO (09:00–10:00) — Smoke test na mobilnom

Sve u **incognito** modu (čist cache):

1. `jadran.ai` → landing učitava brzo, foto tabovi, nula emoji
2. Tap Kamper → setup (foto kartica klikabilna, 9.99€) → tap Istra → chat INSTANT
3. Icebreaker: profesionalan ton, nula emoji, tačna regija
4. Pitaj: "Kako da zamenim ulje na Mercedesu?" → odbijanje
5. Pitaj: "JAOOOO LUDILOOO 🥳🥳 stižemo u Istru" → smiren odgovor
6. Pošalji 10 poruka → 11. → paywall se pojavi
7. Testiraj Stripe (4242 4242 4242 4242, bilo koji datum/CVC)
8. `jadran.ai/api/health` → API OK
9. Nautika mod → provjeri NAVTEX karticu
10. Kruzer mod → Dubrovnik → provjeri Viator linkove u chatu

## JUTRO (10:00–11:00) — Analytics

**Plausible Analytics** (lakši od GA, GDPR-compliant, bez cookie bannera):
- Registracija: plausible.io
- Dodaj script u index.html
- Custom events: `chat_start`, `msg_sent`, `paywall_shown`, `checkout_click`, `payment_success`

## PODNE (11:00–13:00) — Reklame

### Facebook/Instagram:
- Audience: DE + AT + CH, 30-55, interesi: Camping, Kroatien, Segeln, Adria
- Creative: screenshot landing sa foto tabovima
- Tekst: "Dein persönlicher Adria-Guide. 10 Nachrichten gratis."
- Budget: 15€/dan test, 3 ad seta
- Landing: jadran.ai (auto-detect jezik)

### Google Ads:
- Keywords: "croatia camper route", "adriatic sailing guide", "dubrovnik cruise shore excursion"
- Deep link po niši: jadran.ai/ai?niche=camper
- Budget: 10€/dan test

## POPODNE (14:00–16:00) — Monitoring

- Vercel Analytics → traffic
- Stripe Dashboard → prihodi
- /api/health → API zdravlje
- Browser console → JS errors

---

## PRIORITETI PRVE SEDMICE

| Prio | Zadatak | Zašto |
|------|---------|-------|
| P0 | Rate limiting | Spriječava abuse (1 korisnik = 100 API poziva/dan) |
| P0 | Sentry error monitoring | Hvata JS errors u produkciji |
| P1 | Plausible analytics | Mjerenje konverzijskog funnela |
| P1 | A/B test cijena 4.99 vs 6.99 | Optimizacija revenue |
| P2 | Admin dashboard | Revenue + usage pregled |
| P2 | Više B2B partnera u bazi | Konobe, kampovi, marine |

---

## ŠTA JE ZAVRŠENO DANAS (session 4+5)

- Dynamic Prompt Routing (Lego blocks)
- Adriatic Skipper Pro + Shore Excursion Time-Master
- 500+ stringova × 8 jezika (AT Kärntner dijalekt)
- DHMZ NAVTEX za nautičare
- Pravi trial (10 poruka, ne lažnih 24h)
- Cijene: 4.99€/9.99€ (Stripe LIVE)
- 63 affiliate linka (49 GYG + 9 Viator + 7 Booking)
- Foto tabovi + foto hero kartica (zlatni sjaj)
- Social proof blok (2847 korisnika, 47€ ušteda, 4.8 rating)
- AI guardrails (off-topic + koncijež ton)
- Icebreaker bez emoji, profesionalan
- Instant tranzicije (0ms umjesto 450ms)
- Kompletni SEO (robots, sitemap, hreflang, OG image, structured data)
- Perf: fontovi u head, SD video, preconnect
- Region race condition fix
- Mobile touch fix
- KRITIČNO: Missing imports fix (MARINAS/ANCHORAGES/CRUISE_PORTS)
