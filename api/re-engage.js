// POST /api/re-engage — 14-day re-engagement sequence for paywall/exit_intent leads
// 4 touchpoints: D+2 email (25% off), D+5 push, D+8 email (last chance), D+14 push+email
// Called by cron-reengage.js every 12h
// Body: { secret }

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

function strV(s) { return { stringValue: String(s) }; }
function intV(n) { return { integerValue: String(n) }; }

// Re-engagement touchpoints (hours since createdAt)
const RE_SEQUENCE = [
  { reStep: 1, triggerH: 48,   type: "email", templateId: "re_discount" },
  { reStep: 2, triggerH: 120,  type: "push",  templateId: "re_push1"   },
  { reStep: 3, triggerH: 192,  type: "email", templateId: "re_last"    },
  { reStep: 4, triggerH: 336,  type: "both",  templateId: "re_final"   },
];

const SEG_NAMES = {
  de_camper: "Wohnmobil-Kroatien-Guide",
  de_family: "Familien-Kroatien-Guide",
  it_sailor: "guida vela Croazia",
  en_cruiser: "Croatia sailing guide",
  en_camper: "Croatia camper guide",
  en_couple: "Croatia couples guide",
};

// ─── Firestore helpers ───────────────────────────────────────────────────────

async function fsPatch(col, id, fields) {
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  );
  return r.ok;
}

async function queryReEngageLeads(reStep) {
  // Query leads that are at the previous re-engagement step (or 0 for first touchpoint)
  const prevStep = reStep - 1;
  const r = await fetch(`${FS_QUERY}?key=${process.env.VITE_FB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "mkt_leads" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { fieldFilter: { field: { fieldPath: "reEngageStep" }, op: "EQUAL", value: intV(prevStep) } },
              { fieldFilter: { field: { fieldPath: "unsubscribed" }, op: "EQUAL", value: { booleanValue: false } } },
            ],
          },
        },
        limit: 60,
      },
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return data.filter(d => d.document).map(d => ({
    id: d.document.name.split("/").pop(),
    ...d.document.fields,
    _name: d.document.name,
  }));
}

// ─── Email bodies ────────────────────────────────────────────────────────────

function buildReEmail(templateId, email, segmentId, name, leadId) {
  const hi = name ? `Hi ${name},` : "Hi,";
  const unsubUrl = `https://jadran.ai/api/unsubscribe?email=${encodeURIComponent(email)}&seg=${segmentId}`;
  const pixel = `<img src="https://jadran.ai/api/track-open?lid=${encodeURIComponent(leadId)}&step=re${templateId}" width="1" height="1" style="display:none" alt="">`;
  const footer = `${pixel}<p style="color:#94a3b8;font-size:11px;margin-top:24px">
    <a href="${unsubUrl}" style="color:#94a3b8">Unsubscribe</a> · SIAL Consulting d.o.o. · Croatia
  </p>`;
  const btn = (url, label) => `<p style="margin-top:20px"><a href="${url}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">${label}</a></p>`;

  const guideLink = {
    de_camper: "https://jadran.ai/ai?lang=de&niche=camper",
    de_family: "https://jadran.ai/ai?lang=de&niche=family",
    it_sailor: "https://jadran.ai/ai?lang=it&niche=sailor",
    en_cruiser: "https://jadran.ai/ai?lang=en&niche=sailor",
    en_camper:  "https://jadran.ai/ai?lang=en&niche=camper",
    en_couple:  "https://jadran.ai/ai?lang=en&niche=couple",
  };
  const url = guideLink[segmentId] || "https://jadran.ai/ai";
  const guideName = SEG_NAMES[segmentId] || "Croatia guide";

  if (templateId === "re_discount") {
    const BODIES = {
      de_camper: `<p>${hi}</p>
<p>Du hast deinen <strong>${guideName}</strong> fast freigeschaltet — wir haben deinen Platz für dich reserviert.</p>
<p>Heute haben wir etwas Besonderes für dich:</p>
<div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:12px;padding:16px 24px;margin:16px 0;text-align:center">
  <p style="margin:0;font-size:22px;font-weight:700;color:#0ea5e9">25% Rabatt</p>
  <p style="margin:4px 0 0;color:#334155">Nur €14,99 statt €19,99 — 30 Tage Vollzugang</p>
</div>
<p style="color:#64748b;font-size:13px">⏳ Dieses Angebot läuft in 48 Stunden ab.</p>
${btn(url + "&promo=RE25", "Jetzt €14,99 sichern →")}${footer}`,

      de_family: `<p>${hi}</p>
<p>Dein <strong>${guideName}</strong> wartet auf dich — wir haben einen speziellen Rabatt vorbereitet.</p>
<div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:12px;padding:16px 24px;margin:16px 0;text-align:center">
  <p style="margin:0;font-size:22px;font-weight:700;color:#0ea5e9">25% Rabatt</p>
  <p style="margin:4px 0 0;color:#334155">Nur €14,99 statt €19,99 — 30 Tage Vollzugang</p>
</div>
<p style="color:#64748b;font-size:13px">⏳ Nur 48 Stunden gültig.</p>
${btn(url + "&promo=RE25", "Angebot sichern →")}${footer}`,

      default: `<p>${hi}</p>
<p>You left your <strong>${guideName}</strong> behind — we saved your spot.</p>
<div style="background:#f0f9ff;border:2px solid #0ea5e9;border-radius:12px;padding:16px 24px;margin:16px 0;text-align:center">
  <p style="margin:0;font-size:22px;font-weight:700;color:#0ea5e9">25% OFF — just for you</p>
  <p style="margin:4px 0 0;color:#334155">Only €14.99 instead of €19.99 · 30-day full access</p>
</div>
<p style="color:#64748b;font-size:13px">⏳ This offer expires in 48 hours.</p>
${btn(url + "&promo=RE25", "Claim your 25% discount →")}${footer}`,
    };
    return BODIES[segmentId] || BODIES.default;
  }

  if (templateId === "re_last") {
    const BODIES = {
      de_camper: `<p>${hi}</p>
<p>Letzte Erinnerung — dein <strong>25% Rabatt</strong> auf den ${guideName} läuft heute ab.</p>
<p>JADRAN.AI kennt alle legalen Stellplätze, Höhenbeschränkungen, Bora-Warnungen und günstigen Konobas entlang der Dalmatinischen Küste.</p>
<p><strong>7-Tage-Geld-zurück-Garantie</strong> — kein Risiko.</p>
${btn(url + "&promo=RE25LAST", "Letztes Angebot sichern →")}${footer}`,

      default: `<p>${hi}</p>
<p>Last call — your <strong>25% discount</strong> on the ${guideName} expires today.</p>
<p>JADRAN.AI knows every hidden beach, legal camper spot, marina berth and local restaurant on the Croatian coast — AI-powered, in your language.</p>
<p><strong>7-day money-back guarantee</strong> — zero risk.</p>
${btn(url + "&promo=RE25LAST", "Grab the last offer →")}${footer}`,
    };
    return BODIES[segmentId] || BODIES.default;
  }

  if (templateId === "re_final") {
    const BODIES = {
      de_camper: `<p>${hi}</p>
<p>Wir hören auf, dich zu mailen — aber wir wollen dich nicht gehen lassen ohne dir zu sagen:</p>
<p>JADRAN.AI hilft dir, <strong>bessere Entscheidungen</strong> auf deiner Wohnmobil-Tour durch Kroatien zu treffen. Unsere Nutzer sparen durchschnittlich 2+ Stunden Planung pro Tag.</p>
${btn(url, "Noch einen Blick riskieren →")}${footer}`,

      default: `<p>${hi}</p>
<p>This is our last email — but before we go:</p>
<p>JADRAN.AI is the only AI guide built specifically for the Croatian Adriatic. Our users save 2+ hours of planning per day and discover places no travel blog mentions.</p>
<p>If you ever plan a Croatia trip, we'll be here.</p>
${btn(url, "Take one last look →")}${footer}`,
    };
    return BODIES[segmentId] || BODIES.default;
  }

  return `<p>${hi}</p><p>Come back and explore Croatia with JADRAN.AI.</p>${btn(url, "Open JADRAN.AI →")}${footer}`;
}

function getReSubject(templateId, segmentId, name) {
  const SUBJECTS = {
    re_discount: {
      de_camper: "25% Rabatt auf deinen Kroatien-Guide — nur 48h ⏳",
      de_family: "25% Rabatt auf deinen Familienguide — nur 48h ⏳",
      it_sailor:  "25% di sconto sulla tua guida Croazia — 48h ⏳",
      en_cruiser: "25% off your Croatia sailing guide — 48h only ⏳",
      en_camper:  "25% off your Croatia camper guide — 48h only ⏳",
      en_couple:  "25% off your Croatia guide — 48h only ⏳",
      default:    "A special offer just for you — 48h only ⏳",
    },
    re_last: {
      de_camper: "Letzter Tag: 25% Rabatt läuft heute ab 🔔",
      de_family: "Letzter Tag: Dein Rabatt läuft ab 🔔",
      it_sailor:  "Ultimo giorno: lo sconto scade oggi 🔔",
      en_cruiser: "Last day: your discount expires tonight 🔔",
      en_camper:  "Last day: your discount expires tonight 🔔",
      en_couple:  "Last day: your offer expires tonight 🔔",
      default:    "Last day: your special offer expires tonight 🔔",
    },
    re_final: {
      de_camper: "Auf Wiedersehen — viel Spaß in Kroatien 🌊",
      de_family: "Auf Wiedersehen — genießt die Adria 🏖️",
      it_sailor:  "Arrivederci — buona navigazione ⛵",
      en_cruiser: "Safe sailing, wherever you're headed ⛵",
      en_camper:  "Safe travels, wherever the road takes you 🚐",
      en_couple:  "Wishing you a perfect Croatia trip 🌊",
      default:    "From JADRAN.AI — wherever your Croatia adventure takes you",
    },
  };
  const map = SUBJECTS[templateId] || {};
  return map[segmentId] || map.default || "JADRAN.AI";
}

// ─── Email send ──────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "JADRAN.AI <noreply@jadran.ai>", to, subject, html }),
  });
  return r.ok;
}

// ─── Push notification ───────────────────────────────────────────────────────

async function sendPush(segmentId, reStep) {
  const pushSecret = process.env.PUSH_SECRET;
  if (!pushSecret) return false;

  const PUSH_COPY = {
    de_camper: { title: "🚐 Dein Kroatien-Guide wartet", body: "Entdecke Stellplätze, die Google Maps nicht kennt. 5 Nachrichten kostenlos." },
    de_family: { title: "🏖️ Familienurlaub in Kroatien planen", body: "Kinderfreundliche Strände & Restaurants — JADRAN.AI hilft. 5 Nachrichten kostenlos." },
    it_sailor: { title: "⛵ La tua guida vela ti aspetta", body: "Ancoraggi segreti e previsioni Bora — 5 messaggi gratuiti." },
    en_cruiser: { title: "⛵ Your sailing guide is waiting", body: "Secret anchorages, Bura forecasts, ACI tips — 5 free messages." },
    en_camper:  { title: "🚐 Your camper guide is waiting", body: "Legal spots Google Maps doesn't show — 5 free messages." },
    en_couple:  { title: "🌊 Your Croatia guide is ready", body: "Secret beaches & local restaurants — 5 free messages." },
  };
  const copy = PUSH_COPY[segmentId] || { title: "JADRAN.AI — Croatia Adriatic Guide", body: "Pick up where you left off. 5 free messages." };
  const url = "https://jadran.ai/ai";

  try {
    const r = await fetch(`${url.replace("/ai", "")}/api/push-broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Push-Secret": pushSecret },
      body: JSON.stringify({ ...copy, url, tag: `reengage-${reStep}`, requireInteraction: false }),
    });
    return r.ok;
  } catch { return false; }
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const secret = req.body?.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

  const now = Date.now();
  const stats = { emailsSent: 0, pushSent: 0, skipped: 0, errors: 0 };

  for (const seq of RE_SEQUENCE) {
    const leads = await queryReEngageLeads(seq.reStep);

    for (const lead of leads) {
      const email      = lead.email?.stringValue;
      const segmentId  = lead.segmentId?.stringValue || "en_camper";
      const name       = lead.name?.stringValue || "";
      const createdAt  = lead.createdAt?.stringValue;
      const leadId     = lead.id;

      if (!email || !createdAt) { stats.skipped++; continue; }

      // Only re-engage leads created within last 14 days
      const ageH = (now - new Date(createdAt).getTime()) / 3600000;
      if (ageH < seq.triggerH || ageH > 336 /* 14 days */) { stats.skipped++; continue; }

      let success = false;

      // Send email touchpoints
      if (seq.type === "email" || seq.type === "both") {
        const subject = getReSubject(seq.templateId, segmentId, name);
        const html    = buildReEmail(seq.templateId, email, segmentId, name, leadId);
        const ok      = await sendEmail(email, subject, html);
        if (ok) stats.emailsSent++;
        else stats.errors++;
        success = ok;
      }

      // Send push notification touchpoints
      if (seq.type === "push" || seq.type === "both") {
        const ok = await sendPush(segmentId, seq.reStep);
        if (ok) stats.pushSent++;
        success = success || ok;
      }

      // Advance reEngageStep in Firestore
      if (success) {
        await fsPatch("mkt_leads", leadId, {
          ...lead,
          reEngageStep: intV(seq.reStep),
          updatedAt: strV(new Date().toISOString()),
        }).catch(() => {});
      }
    }
  }

  return res.status(200).json({ ok: true, ...stats });
}
