# 🌊 JADRAN AI — Turistički Concierge Platform

AI-powered 24/7 turistički concierge za srednji Jadran.  
3 faze: **Pre-Trip** → **Kiosk (Boravak)** → **Post-Stay**

## Brzi deploy na Vercel (5 minuta)

### Korak 1: GitHub repo
```bash
cd jadran-ai-demo
git init
git add .
git commit -m "JADRAN AI v4.0 — initial deploy"
git remote add origin https://github.com/paunov-tech/jadran-ai-demo.git
git push -u origin main
```

### Korak 2: Deploy na Vercel
```bash
# Ako nemaš Vercel CLI:
npm i -g vercel

# Deploy:
vercel

# Ili za production:
vercel --prod
```

### Korak 3: Postavi API ključ
```bash
# Dodaj Anthropic API key u Vercel env vars:
vercel env add ANTHROPIC_API_KEY

# Ili kroz Vercel Dashboard:
# Settings → Environment Variables → ANTHROPIC_API_KEY = sk-ant-xxx
```

### Korak 4: Redeploy sa ključem
```bash
vercel --prod
```

## Lokalni razvoj
```bash
npm install
cp .env.example .env.local   # dodaj svoj API key
npm run dev                    # http://localhost:5173
```

## Struktura
```
jadran-ai-demo/
├── api/
│   └── chat.js          # Serverless proxy za Claude API
├── src/
│   ├── App.jsx          # Glavni JADRAN AI unified component
│   └── main.jsx         # React entry point
├── index.html           # HTML shell
├── vercel.json          # Vercel routing config
└── vite.config.js       # Vite build config
```

## Monetizacija (bez ugovora)
1. **Premium fee** — 4.99€/gost (Stripe)
2. **Concierge marža** — 15-25€/aktivnost
3. **Affiliate** — 4-8% (Jadrolinija, GetYourGuide)
4. **Host fee** — 20€/mj (neformalno)

## Tech Stack
- React 19 + Vite
- Vercel Serverless Functions
- Claude Sonnet 4 (AI chat)
- Stripe (payment — TBD)

---
**SIAL Consulting d.o.o.** · JADRAN AI v4.0
