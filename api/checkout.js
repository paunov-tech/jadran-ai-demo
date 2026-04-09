import Stripe from "stripe";

// ── META CAPI — server-side AddPaymentInfo ────────────────────────────────
// Fires regardless of browser consent / ad blockers.
// Feeds the retargeting audience even for in-app browser users.
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fireCapiAddPaymentInfo(plan, amount, { deviceId, ip, userAgent, fbp, fbc, eventId } = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const token   = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const userData = {
    ...(ip         ? { client_ip_address: ip }                          : {}),
    ...(userAgent  ? { client_user_agent: userAgent }                   : {}),
    ...(deviceId   ? { external_id: [await sha256(deviceId)]  }        : {}),
    ...(fbp        ? { fbp }                                            : {}),
    ...(fbc        ? { fbc }                                            : {}),
  };

  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name:       "AddPaymentInfo",
          event_time:       Math.floor(Date.now() / 1000),
          event_id:         eventId || `api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          user_data:        userData,
          custom_data:      { value: amount / 100, currency: "EUR", content_name: plan },
          action_source:    "website",
          event_source_url: "https://jadran.ai/ai",
        }],
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.warn("[checkout] CAPI AddPaymentInfo failed:", r.status);
  } catch (err) { console.warn("[checkout] CAPI AddPaymentInfo error:", err.message); }
}

// Rate limit: 20 checkout attempts/hour per IP
const _rl = new Map();
function checkoutRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 20) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  const clientIp = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (!checkoutRateOk(clientIp)) return res.status(429).json({ error: "Too many attempts. Try again later." });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Service temporarily unavailable" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const origin = "https://jadran.ai"; // Hardcoded — prevents open redirect via forged Origin header

  try {
    const { roomCode, guestName, lang, returnPath, plan, region, deviceId, utm_source, utm_medium, utm_campaign, partnerRef, capiEventId = null, fbp = null, fbc = null } = req.body || {};
    if (!plan || !["week", "season", "vip"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });
    // Sanitize partnerRef: only allow JAD-XXX-NNN format (e.g. JAD-RAB-001), strip anything else
    const sanitizedPartnerRef = (typeof partnerRef === "string" && /^JAD-[A-Z]{2,5}-\d{3}$/.test(partnerRef)) ? partnerRef : "";

    const plans = {
      week:   { name: "JADRAN Vodič — Explorer (7 dana)", amount: 999, days: 7 },
      season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 1999, days: 30 },
      vip:    { name: "JADRAN Vodič — VIP Sezona (30 dana)", amount: 4999, days: 30 },
    };
    const p = plans[plan] || plans.week;

    // CRITICAL: Build success/cancel URLs — preserve room/kiosk params so session context survives Stripe redirect
    let basePath = "/ai", persistParams = "";
    try {
      const rUrl = new URL((returnPath || "/ai"), origin);
      basePath = rUrl.pathname;
      const room = rUrl.searchParams.get("room");
      const kiosk = rUrl.searchParams.get("kiosk");
      const parts = [room ? `room=${encodeURIComponent(room)}` : "", kiosk ? `kiosk=${encodeURIComponent(kiosk)}` : ""].filter(Boolean);
      persistParams = parts.length ? "&" + parts.join("&") : "";
    } catch {}
    const successUrl = `${origin}${basePath}?payment=success&plan=${plan}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}${persistParams}`;
    const cancelUrl = `${origin}${basePath}?payment=cancelled${persistParams}`;

    // Build session config
    const sessionConfig = {
      payment_method_types: ["card"],
      customer_creation: "always",
      payment_intent_data: {
        statement_descriptor_suffix: "JADRAN",
        metadata: {
          roomCode: roomCode || "AI-STANDALONE",
          guestName: guestName || "Guest",
          plan: plan || "week",
          region: region || "all",
          days: String(p.days),
          deviceId: deviceId || "unknown",
          lang: lang || "hr",
          utm_source: utm_source || "",
          utm_medium: utm_medium || "",
          utm_campaign: utm_campaign || "",
          partnerRef: sanitizedPartnerRef,
        },
      },
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: p.name,
            description: lang === "de" || lang === "at" ? "AI Reiseführer für die kroatische Küste" : lang === "en" ? "AI travel guide for Croatian coast" : lang === "it" ? "Guida AI per la costa croata" : "AI turistički vodič za hrvatsku obalu",
            tax_code: "txcd_10000000", // Electronically Supplied Services — enables Stripe Tax for EU digital B2C
          },
          unit_amount: p.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      // Invoice = receipt email to customer (legally required)
      invoice_creation: { enabled: true },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        roomCode: roomCode || "AI-STANDALONE",
        guestName: guestName || "Guest",
        plan: plan || "week",
        region: region || "all",
        days: String(p.days),
        deviceId: deviceId || "unknown",
        lang: lang || "hr",
        utm_source: utm_source || "",
        utm_medium: utm_medium || "",
        utm_campaign: utm_campaign || "",
        partnerRef: sanitizedPartnerRef,
      },      locale: lang === "de" || lang === "at" ? "de" : lang === "en" ? "en" : lang === "it" ? "it" : lang === "hr" ? "hr" : "auto",
    };

    // Stripe Tax — only if configured (fails gracefully if not enabled in Dashboard)
    try {
      sessionConfig.automatic_tax = { enabled: true };
      sessionConfig.line_items[0].price_data.tax_behavior = "inclusive";
    } catch {}

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // CAPI AddPaymentInfo — fire-and-forget, no await (don't block response)
    const clientIp2 = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    fireCapiAddPaymentInfo(plan, p.amount, {
      deviceId, ip: clientIp2,
      userAgent: req.headers["user-agent"] || "",
      fbp: typeof fbp === "string" ? fbp : "",
      fbc: typeof fbc === "string" ? fbc : "",
      eventId: capiEventId || `api_${session.id}`,
    }).catch(() => {});

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    // If automatic_tax fails, retry without it
    if (err.message?.includes("tax") || err.message?.includes("Tax")) {
      try {
        const { roomCode, guestName, lang, returnPath, plan, region, deviceId, utm_source, utm_medium, utm_campaign, partnerRef } = req.body || {};
        const sanitizedPartnerRef = (typeof partnerRef === "string" && /^JAD-[A-Z]{2,5}-\d{3}$/.test(partnerRef)) ? partnerRef : "";
        const plans = { week: { name: "JADRAN Vodič — Explorer (7 dana)", amount: 999, days: 7 }, season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 1999, days: 30 }, vip: { name: "JADRAN Vodič — VIP Sezona (30 dana)", amount: 4999, days: 30 } };
        const p = plans[plan] || plans.week;
        let fbPath = "/ai", fbPersist = "";
        try { const u = new URL((returnPath||"/ai"), origin); fbPath = u.pathname; const r2 = u.searchParams.get("room"); const k2 = u.searchParams.get("kiosk"); const pts = [r2?`room=${encodeURIComponent(r2)}`:"", k2?`kiosk=${encodeURIComponent(k2)}`:""].filter(Boolean); fbPersist = pts.length ? "&"+pts.join("&") : ""; } catch {}
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_creation: "always",
          payment_intent_data: { statement_descriptor_suffix: "JADRAN", metadata: { roomCode: roomCode || "AI-STANDALONE", guestName: guestName || "Guest", plan: plan || "week", region: region || "all", days: String(p.days), deviceId: deviceId || "unknown", lang: lang || "hr", utm_source: utm_source || "", utm_medium: utm_medium || "", utm_campaign: utm_campaign || "", partnerRef: sanitizedPartnerRef } },
          line_items: [{ price_data: { currency: "eur", product_data: { name: p.name, description: "AI turistički vodič za hrvatsku obalu" }, unit_amount: p.amount }, quantity: 1 }],
          mode: "payment",
          invoice_creation: { enabled: true },
          success_url: `${origin}${fbPath}?payment=success&plan=${plan}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}${fbPersist}`,
          cancel_url: `${origin}${fbPath}?payment=cancelled${fbPersist}`,
          metadata: { roomCode: roomCode || "AI-STANDALONE", guestName: guestName || "Guest", plan: plan || "week", region: region || "all", days: String(p.days), deviceId: deviceId || "unknown", lang: lang || "hr", utm_source: utm_source || "", utm_medium: utm_medium || "", utm_campaign: utm_campaign || "", partnerRef: sanitizedPartnerRef },
          locale: lang === "de" || lang === "at" ? "de" : lang === "en" ? "en" : lang === "it" ? "it" : lang === "hr" ? "hr" : "auto",
        });
        console.log("Checkout created without Tax (fallback)");
        return res.status(200).json({ sessionId: session.id, url: session.url });
      } catch (err2) {
        return res.status(500).json({ error: err2.message });
      }
    }
    return res.status(500).json({ error: err.message });
  }
}
