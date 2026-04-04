# CLAUDE.md — jadran-ai-demo

## AUTOMATIC FIX AFTER ANY App.jsx COPY

After EVERY `cp .../App.jsx src/App.jsx`, verify the `TransitMap` iframe in App.jsx:

1. The `src` URL must NOT contain `&key=` — key is sent via postMessage, never in the URL.
2. The `<iframe>` must have an `onLoad` handler:
```jsx
onLoad={() => {
  if (iframeRef.current?.contentWindow) {
    iframeRef.current.contentWindow.postMessage(
      { type: "map_init", key: HERE_ROUTING_KEY },
      window.location.origin
    );
  }
}}
```

`map.html` receives the key via `{ type: "map_init", key }` postMessage and calls `initMap(key)`.
This keeps the HERE API key out of the URL bar and browser history.
Apply silently before building whenever App.jsx is replaced.

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
