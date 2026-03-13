import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin === "https://jadran.ai" ? "https://jadran.ai" : req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { roomCode, guestName, lang, returnPath, plan, region, deviceId } = req.body || {};
    if (!plan || !["week", "season"].includes(plan)) return res.status(400).json({ error: "Invalid plan" });
    const origin = "https://jadran.ai"; // Hardcoded — prevents open redirect via forged Origin header

    const plans = {
      week:   { name: "JADRAN Vodič — Tjedan (7 dana)", amount: 499, days: 7 },
      season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 999, days: 30 },
    };
    const p = plans[plan] || plans.week;

    // CRITICAL: Build success/cancel URLs properly — returnPath may contain "?" already
    // Strip any query params from returnPath (they are recovered from localStorage on reload)
    const basePath = (returnPath || "/ai").split("?")[0];
    const successParams = `payment=success&plan=${plan}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}`;
    const successUrl = `${origin}${basePath}?${successParams}`;
    const cancelUrl = `${origin}${basePath}?payment=cancelled`;

    // Build session config
    const sessionConfig = {
      payment_method_types: ["card"],
      customer_creation: "always",
      payment_intent_data: {
        statement_descriptor_suffix: "JADRAN",
      },
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: p.name,
            description: lang === "de" || lang === "at" ? "AI Reiseführer für die kroatische Küste" : lang === "en" ? "AI travel guide for Croatian coast" : lang === "it" ? "Guida AI per la costa croata" : "AI turistički vodič za hrvatsku obalu",
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
      },
      locale: lang === "de" || lang === "at" ? "de" : lang === "en" ? "en" : lang === "it" ? "it" : lang === "hr" ? "hr" : "auto",
    };

    // Stripe Tax — only if configured (fails gracefully if not enabled in Dashboard)
    try {
      sessionConfig.automatic_tax = { enabled: true };
      sessionConfig.line_items[0].price_data.tax_behavior = "inclusive";
    } catch {}

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    // If automatic_tax fails, retry without it
    if (err.message?.includes("tax") || err.message?.includes("Tax")) {
      try {
        const { roomCode, guestName, lang, returnPath, plan, region, deviceId } = req.body || {};
        const plans = { week: { name: "JADRAN Vodič — Tjedan (7 dana)", amount: 499, days: 7 }, season: { name: "JADRAN Vodič — Sezona (30 dana)", amount: 999, days: 30 } };
        const p = plans[plan] || plans.week;
        const basePath = (returnPath || "/ai").split("?")[0];
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_creation: "always",
          payment_intent_data: { statement_descriptor_suffix: "JADRAN" },
          line_items: [{ price_data: { currency: "eur", product_data: { name: p.name, description: "AI turistički vodič za hrvatsku obalu" }, unit_amount: p.amount }, quantity: 1 }],
          mode: "payment",
          invoice_creation: { enabled: true },
          success_url: `${origin}${basePath}?payment=success&plan=${plan}&days=${p.days}&region=${region || "all"}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}${basePath}?payment=cancelled`,
          metadata: { roomCode: roomCode || "AI-STANDALONE", guestName: guestName || "Guest", plan: plan || "week", region: region || "all", days: String(p.days), deviceId: deviceId || "unknown", lang: lang || "hr" },
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
