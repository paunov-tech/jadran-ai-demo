# CLAUDE.md — jadran-ai-demo

## AUTOMATIC FIX AFTER ANY App.jsx COPY

After EVERY `cp .../App.jsx src/App.jsx`, immediately patch line 73:

```
FIND:
    ? `/map.html?flat=${fromCoords[0]}&flon=${fromCoords[1]}&tlat=${toCoords[0]}&tlon=${toCoords[1]}`

REPLACE WITH:
    ? `/map.html?flat=${fromCoords[0]}&flon=${fromCoords[1]}&tlat=${toCoords[0]}&tlon=${toCoords[1]}&key=${import.meta.env.VITE_HERE_API_KEY}`
```

This fix removes the hardcoded HERE API key from `public/map.html`.
It must be re-applied every time because upstream App.jsx files don't include it.
Do NOT skip this. Do NOT ask — just apply it silently before building.

## STANDARD DEPLOY SEQUENCE

```bash
npx vite build        # must show ✓ built in
git add -A && git commit -m "..."
git push origin main
vercel --prod
```

## ENVIRONMENT

- Production: https://jadran.ai
- Vercel project: miroslav-paunov/jadran-ai-demo
- GitHub: paunov-tech/jadran-ai-demo
- HERE key lives in: VITE_HERE_API_KEY (Vercel env var)
- All API keys: Vercel env vars only — never hardcode
