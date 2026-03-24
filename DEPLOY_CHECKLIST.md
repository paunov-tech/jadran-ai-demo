# JADRAN.AI — Deploy Checklist (24. mart 2026)
# Uradi SVE pre `vercel --prod`

## 1. Vercel Environment Variables (OBAVEZNO PRE DEPLOYA)

Idi na: https://vercel.com/paunov-9332/jadran-ai-demo/settings/environment-variables

Dodaj ove VITE_ varijable (frontend ih zahteva, ključevi su izbačeni iz koda):

```
VITE_HERE_API_KEY = 0baWwk3UMqKmttJIQWhv-ocxS7vOFncDkbLKb68JKxw
VITE_FB_API_KEY = (tvoj Firebase API key)
VITE_FB_MSG_ID = 1010121862220
VITE_FB_APP_ID = 1:1010121862220:web:fc08a0aa51ca0415e058e9
```

Proveri da postoje (treba da su već tamo):
```
ANTHROPIC_API_KEY = sk-ant-...
HERE_API_KEY = 0baWwk3UMqKmttJIQWhv-ocxS7vOFncDkbLKb68JKxw
FIREBASE_API_KEY = ...
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

## 2. Git Push

```bash
cd jadran-ai-demo
git remote set-url origin https://paunov-tech:TOKEN@github.com/paunov-tech/jadran-ai-demo.git

# Safety tag first
git push origin BACKUP_PRE_SPRINT_24MAR

# Push all 13 commits
git push origin main

# Production tag
git tag STABLE_v4.0_PRODUCTION
git push origin STABLE_v4.0_PRODUCTION
```

## 3. Deploy

```bash
vercel --prod
```

## 4. Post-Deploy Verification

- [ ] jadran.ai loads (landing page)
- [ ] jadran.ai/ai loads (StandaloneAI)
- [ ] jadran.ai/tz loads (TZ Dashboard login)
- [ ] jadran.ai/host loads (Host Panel)
- [ ] Select segment → cities → "Kreni sa mnom" → transit map appears
- [ ] Route distance shows correct km (not ~200km for long routes)
- [ ] Flag selector changes AI language
- [ ] "Stigli → Pokreni Kiosk" → welcome screen → nearby places load
- [ ] Kiosk quick tiles show result counts
- [ ] Tap parking/food → real nearby places with distances
- [ ] Walk/Drive navigation buttons open HERE WeGo
- [ ] No console errors in DevTools
- [ ] Sentry dashboard: no new errors

## 5. Rollback (if anything breaks)

```bash
git reset --hard BACKUP_PRE_SPRINT_24MAR
git push -f origin main
vercel --prod
```
