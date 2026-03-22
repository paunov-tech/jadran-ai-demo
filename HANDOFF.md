# Jadran.ai — Sprint 6 Handoff for Srđan

**Date:** 2026-03-22
**Deployed:** https://jadran.ai
**Repo:** https://github.com/paunov-tech/jadran-ai-demo

---

## Sprint 6 — What Was Built

### 6A — DELTA_CONTEXT + Segment Picker
- Module-level `DELTA_CTX_DEFAULTS` schema (segment, transport, from, destination, travelers, arrival_date, budget, interests, phase, yolo_region, checklist_done)
- `loadDelta()` / `saveDelta()` with localStorage key `jadran_delta_context`
- `window.__DELTA` for browser debugging
- 4 segments: 🚐 Kamperi | 👨‍👩‍👧 Porodice | 💑 Parovi | ⛵ Nautičari
- 4-step onboarding: Segment → Odakle si (EU_CITIES autocomplete) → Kuda ideš (region cards) → Kada i koliko
- `priprema` subScreen: segment checklist with progress bar
- api/chat.js: `[DELTA KONTEKST]` block prepended to system prompt

### 6B — Segment-Aware Transit
- Transit screen shows different content per segment (kamper/porodica/par/jedrilicar)
- Kamper: truck routing, Karavanke 4.1m warning, LPG tips, dump stations
- Porodica: WC pauses, McDonald's on route, kid-friendly ETA
- Par: scenic viewpoints, wine region, romantic dinner suggestions
- Jedrilicar: marina VHF, wind, prepopulated WhatsApp to marina
- Border refresh: 10min → 5min, push notification if crossing >30min wait
- Arrival modal: weather strip + segment-specific arrival suggestions
- Morning briefing: 8am auto-show (once/day) with weather + YOLO + segment tips

### 6C — Faza 3 Odmor
- Daily AI suggestions strip in KioskHome (3 items per segment)
- KioskBeach screen: 5 beaches, YOLO crowd, segment-sorted, amenity icons
- Viator modal v2: description expand, inclusions chips, cancellation badge, orange CTA
- "Ideš negdje?" proactive nudge after 2h inactivity
- LOCAL_PARTNERS set with badge + Firebase analytics click tracking

### 6D — Faza 4 Povratak + Retention
- "Idem kući" button appears from day 6 of stay
- KioskPovratak screen: farewell + weather comparison (destination vs home)
- Departure checklist per segment (4 items, tap to check, progress bar)
- Return HERE Maps route: destination → home city (reversed), gold polyline
- Segment return tips + border intelligence summary
- Rating (5 stars): ≥4 → Google review link, 1-3 → feedback form → Firestore
- Loyalty: +125 points, tier display (Morski val / Dalmatin / Jadran Legend)
- Next destination cards (segment-filtered, Booking.com affiliate)
- Referral: share link with ref={deviceId}+seg param

---

## DELTA_CONTEXT Schema

```js
{
  segment: null,          // "kamper" | "porodica" | "par" | "jedrilicar"
  transport: null,        // "auto" | "kamper" | "avion" | "jahta"
  from: null,             // departure city name
  from_coords: null,      // {lat, lng}
  destination: null,      // {city, lat, lon, region}
  travelers: { adults: 2, kids: [], kids_ages: [] },
  arrival_date: null,     // ISO date string
  budget: null,           // "low" | "mid" | "high"
  interests: [],          // array of interest keys
  room_code: null,
  phase: "landing",       // landing|inspiracija|priprema|transit|odmor|povratak
  yolo_region: null,
  checklist_done: [],     // array of checked item IDs
}
```

---

## Architecture

| Layer | Tech | Notes |
|---|---|---|
| Frontend | React 19 + Vite | SPA, `/ai` route |
| API | Vercel serverless functions | `/api/*.js` (ESM) |
| DB | Firestore (molty-portal) | guests, premium, yolo, feedback |
| AI | Claude Haiku 4.5 | chat + vision (border cameras) |
| Maps | HERE Maps JS API v3.1 | routing + geocoding |
| Payments | Stripe | checkout + webhooks |
| Push | Web Push + VAPID | push-subscribe + push-send |
| Analytics | Plausible (jadran.ai) | + Firebase analytics events |

---

## Active API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/camera` | Beach/marina YOLO crowd data |
| `GET /api/border-cameras` | Promet.si + Claude Vision border status |
| `GET /api/border-intelligence` | Aggregated border crossing data |
| `GET /api/weather` | Open-Meteo weather for destination |
| `POST /api/chat` | Claude AI chat (injects DELTA_CONTEXT) |
| `POST /api/checkout` | Stripe premium checkout |
| `POST /api/webhook` | Stripe webhook → Firestore + Resend email |
| `POST /api/verify` | Verify Stripe payment |
| `POST /api/viator-search` | Viator activity search |
| `POST /api/viator-book` | Viator booking via Stripe |
| `POST /api/push-subscribe` | Register push subscription |
| `POST /api/push-send` | Send push notification |
| `POST /api/notify` | Guest checkin email via Resend |

---

## Environment Variables (Vercel)

| Variable | Required by |
|---|---|
| `ANTHROPIC_API_KEY` | api/chat.js, api/border-cameras.js |
| `FIREBASE_API_KEY` | All Firestore operations |
| `STRIPE_SECRET_KEY` | api/checkout.js, api/verify.js |
| `STRIPE_WEBHOOK_SECRET` | api/webhook.js |
| `VITE_HERE_API_KEY` | Frontend HERE Maps |
| `VAPID_PUBLIC_KEY` | api/push-subscribe.js |
| `VAPID_PRIVATE_KEY` | api/push-send.js |
| `VAPID_EMAIL` | api/push-send.js |
| `RESEND_API_KEY` | api/webhook.js, api/notify.js |

---

## Deployment Checklist for Srđan

- [ ] `vercel env add RESEND_API_KEY` — for payment emails
- [ ] `vercel env add VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_EMAIL` — for push notifications
- [ ] Set Stripe webhook URL: `https://jadran.ai/api/webhook`
- [ ] Test Stripe test mode payment → check `info@sialconsulting.com` inbox
- [ ] Google review link in `KioskPovratak`: replace `https://g.page/r/your-google-review-link`
- [ ] `window.__DELTA` in browser console to debug DELTA_CONTEXT
- [ ] Admin panel: `https://jadran.ai/ai?admin=sial`
- [ ] Host panel: `https://jadran.ai/host` (PIN: jadran2026)
