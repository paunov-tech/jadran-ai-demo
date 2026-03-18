# 🌊 JADRAN.AI — AI Tourist Guide for the Croatian Adriatic

Live: **https://jadran.ai** · Repo: `paunov-tech/jadran-ai-demo`

AI-powered tourist guide for the Croatian coast. 4 niches (camper, local, nautical, cruise), 6 regions, 8 languages.

## Stack

- **Frontend:** React 19 + Vite, deployed on Vercel
- **AI:** Claude Sonnet 4 (chat), Gemini 2.0 Flash (vision/daily)
- **Payment:** Stripe LIVE (9.99€/week, 19.99€/season, 49.99€/VIP)
- **Database:** Firebase Firestore (molty-portal project)
- **Analytics:** Plausible + Meta Pixel

## Structure

```
src/
  StandaloneAI.jsx   # Main chat app (jadran.ai/ai) — 2,600 lines
  LandingPage.jsx    # Marketing landing (jadran.ai/)
  App.jsx            # Guest room flow (?room=XXXX)
  HostPanel.jsx      # Host admin (/host)
  data.js            # 63 affiliate links, campsite DB
  firebase.js        # Firebase config
  main.jsx           # Router (lazy loading)

api/
  chat.js            # Claude AI + prompt builder (inlined) — 1,230 lines
  checkout.js        # Stripe checkout session
  verify.js          # Payment verification + Firestore backup
  webhook.js         # Stripe webhook → Firestore
  recover.js         # Email-based subscription recovery
  vision.js          # Gemini photo analysis (Jadran Lens)
  weather.js         # Weather API proxy
  navtex.js          # DHMZ NAVTEX scraper
  alerts.js          # Emergency alert system
  dmo.js             # Destination management engine
  referral.js        # Viral referral system
  usage.js           # Server-side usage tracking
  gemini.js          # Gemini text API
  daily.js           # Daily digest generator
  health.js          # Health check
```

## Environment Variables (Vercel)

| Variable | Required | Used by |
|---|---|---|
| ANTHROPIC_API_KEY | Yes | chat.js |
| STRIPE_SECRET_KEY | Yes | checkout, verify, recover, webhook |
| STRIPE_WEBHOOK_SECRET | Yes | webhook.js |
| FIREBASE_API_KEY | Yes | chat, verify, recover, webhook, referral, usage, dmo |
| GEMINI_API_KEY | Yes | vision, gemini, daily |
| GOOGLE_PLACES_API_KEY | No | dmo.js |

## Key Rules

- `api/chat.js` has INLINED prompt builder — Vercel cannot import sibling files
- Trial: 3 free messages → paywall (server-side Firestore enforcement)
- Prices: 9.99€/week (999c), 19.99€/season (1999c), 49.99€/VIP (4999c)
- 8 languages: HR, EN, DE, IT, AT (Karntner), SI, CZ, PL
- AI guardrails: zero emoji, zero exclamation marks, professional concierge tone
- Icebreaker is CLIENT-SIDE JS — does not go through Claude API
- Host PIN: jadran2026 | Admin: ?admin=sial, ?unlock=sial

## Local Development

```bash
npm install
cp .env.example .env.local  # add your keys
npm run dev                  # http://localhost:5173
```

---
**SIAL Consulting d.o.o.** · Bizeljska cesta 5, 8250 Brežice, Slovenia · info@sialconsulting.com
