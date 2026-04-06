// POST /api/email-send (called by email-scheduler cron)
// Sends next drip email to eligible leads.
// Body: { secret } — must match CRON_SECRET env var

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

// Drip sequence: delayH = hours after previous step
const SEQUENCE = [
  { step: 1, delayH: 24,  templateId: "tip1" },
  { step: 2, delayH: 72,  templateId: "social" },
  { step: 3, delayH: 168, templateId: "upgrade" },
];

const SEG_SUBJECTS = {
  de_camper:  ["3 Insider-Tipps für Wohnmobil-Reisende in Kroatien 🚐", "Was andere Camper sagen ⭐", "Dein kompletter Kroatien-Wohnmobilplan 🗺️"],
  de_family:  ["3 Geheimtipps für Familienurlaub an der Adria 🏖️", "Was andere Familien sagen ⭐", "Dein perfekter Kroatien-Familienplan 🗺️"],
  it_sailor:  ["3 consigli insider per navigare in Croazia ⛵", "Cosa dicono gli altri velisti ⭐", "Il tuo piano di navigazione completo 🗺️"],
  en_cruiser: ["3 insider tips for sailing Croatia ⛵", "What other sailors say about JADRAN.AI ⭐", "Your complete Croatia sailing plan 🗺️"],
  en_camper:  ["3 insider tips for campervanning Croatia 🚐", "What other campers say about JADRAN.AI ⭐", "Your complete Croatia camper route 🗺️"],
  en_couple:  ["3 secret spots most tourists never find 🌊", "What couples say about JADRAN.AI ⭐", "Your perfect Croatia couples itinerary 🗺️"],
};
const DEFAULT_SUBJECTS = ["3 insider tips for Croatia 🌊", "What travellers say about JADRAN.AI ⭐", "Your full Croatia trip plan 🗺️"];

function getSubject(step, segmentId) {
  const arr = SEG_SUBJECTS[segmentId] || DEFAULT_SUBJECTS;
  return arr[step - 1] || DEFAULT_SUBJECTS[step - 1];
}

function strV(s) { return { stringValue: String(s) }; }
function intV(n) { return { integerValue: String(n) }; }

async function fsGet(col, id) {
  const r = await fetch(`${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`);
  if (!r.ok) return null;
  return r.json();
}

async function fsPatch(col, id, fields) {
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  );
  return r.ok;
}

async function queryLeadsForStep(step) {
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
              { fieldFilter: { field: { fieldPath: "emailStep" }, op: "EQUAL", value: intV(step - 1) } },
              { fieldFilter: { field: { fieldPath: "unsubscribed" }, op: "EQUAL", value: { booleanValue: false } } },
            ],
          },
        },
        limit: 50, // process 50 per cron run to stay within limits
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

function getEmailBody(templateId, email, segmentId, name, leadId, step) {
  const unsubUrl = `https://jadran.ai/api/unsubscribe?email=${encodeURIComponent(email)}&seg=${segmentId}`;
  const pixel = `<img src="https://jadran.ai/api/track-open?lid=${encodeURIComponent(leadId)}&step=${step}" width="1" height="1" style="display:none" alt="">`;
  const hi = name ? `Hi ${name},` : "Hi,";
  const footer = `${pixel}<p style="color:#94a3b8;font-size:11px;margin-top:24px">
    <a href="${unsubUrl}">Unsubscribe</a> · SIAL Consulting d.o.o. · Croatia
  </p>`;
  const btn = (url, label) => `<p style="margin-top:20px"><a href="${url}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">${label}</a></p>`;

  const TIPS = {
    de_camper: `<p>${hi}</p><p>3 Dinge, die erfahrene Wohnmobilreisende an der Adria wissen:</p>
<ul>
  <li>🅿️ <strong>Camp Soline (Brač)</strong> — bester Sonnenuntergang, außerhalb der Saison kostenlos</li>
  <li>📏 <strong>Tunnel Učka</strong> — max. 4,2m Höhe. Viele GPS-Navis kennen das Limit nicht.</li>
  <li>🌬️ <strong>Bora-Wind</strong> — wenn die Flaggen in Zadar waagerecht stehen, fahr nicht weiter auf der Küstenstraße</li>
</ul>
${btn("https://jadran.ai/ai?lang=de&niche=camper", "Mehr Tipps von JADRAN.AI →")}${footer}`,

    de_family: `<p>${hi}</p><p>3 Geheimtipps für Familien an der Adria:</p>
<ul>
  <li>🏖️ <strong>Saharun (Dugi Otok)</strong> — flaches Wasser, weißer Sand, ideal für kleine Kinder</li>
  <li>🍕 <strong>Konoba Mate (Brač)</strong> — kinderfreundlich, echte kroatische Küche, keine Touristenfallen</li>
  <li>🚗 <strong>Parken in Split</strong> — Park&Ride Brodogradilište spart dir 40min Suche täglich</li>
</ul>
${btn("https://jadran.ai/ai?lang=de&niche=family", "Mehr Tipps von JADRAN.AI →")}${footer}`,

    it_sailor: `<p>${hi}</p><p>3 consigli da velisti locali:</p>
<ul>
  <li>⚓ <strong>Cala Stiniva (Vis)</strong> — ancora prima delle 8, dopo è piena di charter</li>
  <li>🌬️ <strong>Bora da Zadar</strong> — se il NAVTEX segnala >25kn, aspetta a Šibenik</li>
  <li>🦑 <strong>Marina Palmižana</strong> — prenota con 48h di anticipo in luglio/agosto</li>
</ul>
${btn("https://jadran.ai/ai?lang=it&niche=sailor", "Chiedi a JADRAN.AI →")}${footer}`,

    en_cruiser: `<p>${hi}</p><p>3 tips from local sailors:</p>
<ul>
  <li>⚓ <strong>Stiniva cove (Vis)</strong> — anchor before 8am, charter fleets arrive by 10</li>
  <li>📡 <strong>Bura from Zadar</strong> — if NAVTEX shows >25kn north, wait it out in Šibenik</li>
  <li>🦑 <strong>ACI Palmižana</strong> — book 48h ahead in July/August or anchor outside</li>
</ul>
${btn("https://jadran.ai/ai?lang=en&niche=sailor", "Ask JADRAN.AI for your route →")}${footer}`,

    en_camper: `<p>${hi}</p><p>3 things experienced Adriatic campers know:</p>
<ul>
  <li>🅿️ <strong>Camp Soline (Brač)</strong> — best sunset on the coast, free in shoulder season</li>
  <li>📏 <strong>Učka tunnel</strong> — max 4.2m height. Most GPS apps don't warn you.</li>
  <li>🌬️ <strong>Bura wind</strong> — when flags in Zadar go horizontal, pull over and wait</li>
</ul>
${btn("https://jadran.ai/ai?lang=en&niche=camper", "Get your camper route →")}${footer}`,

    en_couple: `<p>${hi}</p><p>3 spots most tourists never find:</p>
<ul>
  <li>🏖️ <strong>Saharun beach (Dugi Otok)</strong> — white sand, turquoise water, 2h ferry from Zadar</li>
  <li>🍷 <strong>Konoba Bako (Vis)</strong> — no menu, fisherman brings what he caught. Book ahead.</li>
  <li>🌅 <strong>Vidilica viewpoint (Split)</strong> — golden hour over the old town, zero tourists</li>
</ul>
${btn("https://jadran.ai/ai?lang=en&niche=couple", "Find your secret spots →")}${footer}`,
  };

  const SOCIAL = {
    de_camper: `<p>${hi}</p><p>Was andere Wohnmobilreisende sagen:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "JADRAN.AI hat uns vor einem teuren Bußgeld gerettet — hat uns einen Stellplatz gefunden, den Google Maps nicht mal kennt."<br>
  <small style="color:#64748b">— Klaus & Renate, Wohnmobil-Tour Istrien–Dubrovnik</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=de&niche=camper", "Jetzt ausprobieren →")}${footer}`,

    de_family: `<p>${hi}</p><p>Was andere Familien sagen:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "Meine Kinder fragten jede Stunde 'wann sind wir da?' — bis wir JADRAN.AI öffneten. Dann waren sie still und haben mitgeplant."<br>
  <small style="color:#64748b">— Familie Weber, Split–Hvar–Brač</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=de&niche=family", "Jetzt ausprobieren →")}${footer}`,

    it_sailor: `<p>${hi}</p><p>Cosa dicono gli altri velisti:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "Ho trovato tre baie che non esistono su Google Maps. JADRAN.AI è incredibile per chi naviga in Croazia."<br>
  <small style="color:#64748b">— Marco, traversata Ancona–Spalato</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=it&niche=sailor", "Prova adesso →")}${footer}`,

    en_cruiser: `<p>${hi}</p><p>What other sailors say:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "Found three anchorages that aren't on any chart app. JADRAN.AI is the best tool I've used for Croatian waters."<br>
  <small style="color:#64748b">— James, sailing Ancona to Dubrovnik</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=en&niche=sailor", "Try it yourself →")}${footer}`,

    en_camper: `<p>${hi}</p><p>What other campers say:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "JADRAN.AI saved us from a €200 fine — found us a legal spot that Google Maps doesn't even show."<br>
  <small style="color:#64748b">— Dave & Sarah, campervan trip Split to Istria</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=en&niche=camper", "Try it yourself →")}${footer}`,

    en_couple: `<p>${hi}</p><p>What couples say:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:14px;color:#334155;font-style:italic">
  "We had the beach completely to ourselves for two hours. JADRAN.AI sent us somewhere no travel blog has mentioned."<br>
  <small style="color:#64748b">— Sophie & Tom, island-hopping from Split</small>
</blockquote>
${btn("https://jadran.ai/ai?lang=en&niche=couple", "Find your spot →")}${footer}`,
  };

  const UPGRADE = {
    de_camper: `<p>${hi}</p><p>Deine Kroatien-Tour rückt näher — lass uns sie perfekt machen.</p>
<p>JADRAN.AI kennt <strong>alle legalen Stellplätze</strong>, Höhenbeschränkungen, Bora-Warnungen und günstige Konobas entlang der Küste — auf Deutsch.</p>
${btn("https://jadran.ai/ai?lang=de&niche=camper", "Meinen Wohnmobilguide öffnen →")}${footer}`,

    de_family: `<p>${hi}</p><p>Familienurlaub in Kroatien — wir helfen dir, ihn unvergesslich zu machen.</p>
<p>JADRAN.AI findet kinderfreundliche Strände, Restaurants ohne Touristenfallen und die beste Anreiseroute für deine Familie — auf Deutsch.</p>
${btn("https://jadran.ai/ai?lang=de&niche=family", "Meinen Familienguide öffnen →")}${footer}`,

    it_sailor: `<p>${hi}</p><p>La tua crociera in Croazia si avvicina — rendiamola perfetta.</p>
<p>JADRAN.AI conosce <strong>ogni marina ACI</strong>, ancoraggio libero, previsione Bora e ristorante di pesce fresco lungo la costa — in italiano.</p>
${btn("https://jadran.ai/ai?lang=it&niche=sailor", "Apri la mia guida →")}${footer}`,

    en_cruiser: `<p>${hi}</p><p>Your Croatia cruise is coming up — let's make it perfect.</p>
<p>JADRAN.AI knows every ACI marina, free anchorage, Bura forecast and fresh fish restaurant along the coast — all in English.</p>
${btn("https://jadran.ai/ai?lang=en&niche=sailor", "Open my sailing guide →")}${footer}`,

    en_camper: `<p>${hi}</p><p>Your Croatia road trip is coming up — let's make it perfect.</p>
<p>JADRAN.AI knows every legal camper stop, height restriction, Bura warning and cheap konoba along the coast — all in English.</p>
${btn("https://jadran.ai/ai?lang=en&niche=camper", "Open my camper guide →")}${footer}`,

    en_couple: `<p>${hi}</p><p>Your Croatia trip is coming up — let's make it unforgettable.</p>
<p>JADRAN.AI knows the secret beaches, the restaurants where locals eat, and the sunset spots that don't end up on Instagram — all yours.</p>
${btn("https://jadran.ai/ai?lang=en&niche=couple", "Open my couples guide →")}${footer}`,
  };

  const fallback = `<p>${hi}</p><p>Thanks for using JADRAN.AI.</p>${btn("https://jadran.ai/ai", "Open JADRAN.AI →")}${footer}`;

  if (templateId === "tip1")   return TIPS[segmentId]    || TIPS.en_camper    || fallback;
  if (templateId === "social") return SOCIAL[segmentId]  || SOCIAL.en_camper  || fallback;
  if (templateId === "upgrade") return UPGRADE[segmentId] || UPGRADE.en_camper || fallback;
  return fallback;
}

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const secret = req.body?.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

  const now = Date.now();
  let sent = 0;
  let skipped = 0;

  for (const seq of SEQUENCE) {
    const leads = await queryLeadsForStep(seq.step);

    for (const lead of leads) {
      const email = lead.email?.stringValue;
      const segmentId = lead.segmentId?.stringValue || "";
      const name = lead.name?.stringValue || "";
      const updatedAt = lead.updatedAt?.stringValue;
      if (!email || !updatedAt) { skipped++; continue; }

      // Check if enough time has passed since last email
      const lastEmailTime = new Date(updatedAt).getTime();
      const requiredDelay = seq.delayH * 3600 * 1000;
      if (now - lastEmailTime < requiredDelay) { skipped++; continue; }

      const subject = getSubject(seq.step, segmentId);
      const html = getEmailBody(seq.templateId, email, segmentId, name, lead.id, seq.step);
      const ok = await sendEmail(email, subject, html);
      if (ok) {
        await fsPatch("mkt_leads", lead.id, {
          ...lead,
          emailStep: intV(seq.step),
          updatedAt: strV(new Date().toISOString()),
        });
        sent++;
      } else {
        skipped++;
      }
    }
  }

  return res.status(200).json({ ok: true, sent, skipped });
}
