// POST /api/email-send (called by email-scheduler cron)
// Sends next drip email to eligible leads.
// Body: { secret } — must match CRON_SECRET env var

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FS_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

// Drip sequence: delayH = hours after previous step
const SEQUENCE = [
  { step: 1, delayH: 24,  subject: "3 insider tips for Croatia 🌊", templateId: "tip1" },
  { step: 2, delayH: 72,  subject: "What travellers say about JADRAN.AI ⭐", templateId: "social" },
  { step: 3, delayH: 168, subject: "Your full Croatia trip plan 🗺️", templateId: "upgrade" },
];

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

function getEmailBody(templateId, email, segmentId) {
  const unsubUrl = `https://jadran.ai/api/unsubscribe?email=${encodeURIComponent(email)}&seg=${segmentId}`;
  const footer = `<p style="color:#94a3b8;font-size:11px;margin-top:24px">
    <a href="${unsubUrl}">Unsubscribe</a> · SIAL Consulting d.o.o. · Croatia
  </p>`;

  const bodies = {
    tip1: `<p>Here are 3 tips from our local experts:</p>
<ul>
  <li>🚐 <strong>Camp Soline (Brač)</strong> — best sunset spot, free in shoulder season</li>
  <li>🌊 <strong>Stiniva cove</strong> — arrive before 9am to beat the boats</li>
  <li>⛵ <strong>Bura wind</strong> — always check NAVTEX before setting sail from Zadar</li>
</ul>
<p><a href="https://jadran.ai/ai">Ask JADRAN.AI for more →</a></p>${footer}`,

    social: `<p>Don't just take our word for it:</p>
<blockquote style="border-left:3px solid #0ea5e9;padding-left:12px;color:#334155">
  "Found three hidden beaches that Google Maps doesn't even show. JADRAN.AI is incredible."<br>
  <small>— Marco, sailing from Ancona to Split</small>
</blockquote>
<p><a href="https://jadran.ai/ai">Try it yourself →</a></p>${footer}`,

    upgrade: `<p>Your Croatia trip is coming up — let's make it perfect.</p>
<p>JADRAN.AI can plan your full route: marinas, camper stops, hidden beaches, restaurants — all in your language.</p>
<p><a href="https://jadran.ai/ai" style="background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Open your guide →</a></p>${footer}`,
  };
  return bodies[templateId] || `<p>Thanks for using JADRAN.AI.</p>${footer}`;
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
      const updatedAt = lead.updatedAt?.stringValue;
      if (!email || !updatedAt) { skipped++; continue; }

      // Check if enough time has passed since last email
      const lastEmailTime = new Date(updatedAt).getTime();
      const requiredDelay = seq.delayH * 3600 * 1000;
      if (now - lastEmailTime < requiredDelay) { skipped++; continue; }

      const html = getEmailBody(seq.templateId, email, segmentId);
      const ok = await sendEmail(email, seq.subject, html);
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
