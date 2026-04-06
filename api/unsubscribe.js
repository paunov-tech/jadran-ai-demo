// GET /api/unsubscribe?email=...&seg=...
// Sets unsubscribed:true in Firestore, returns confirmation HTML page.

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function fsSet(col, id, fields) {
  const r = await fetch(
    `${FS}/${col}/${id}?key=${process.env.VITE_FB_API_KEY}&updateMask.fieldPaths=unsubscribed&updateMask.fieldPaths=updatedAt`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  );
  return r.ok;
}

function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — JADRAN.AI</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0a1628;color:#f0f9ff;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(14,165,233,0.15);border-radius:20px;padding:40px 32px;max-width:420px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:20px}.h{font-size:22px;font-weight:700;margin-bottom:12px}.p{color:#7dd3fc;font-size:15px;line-height:1.6;margin-bottom:24px}
a{color:#0ea5e9;text-decoration:none;font-size:14px}</style></head>
<body><div class="card">${body}</div></body></html>`;
}

export default async function handler(req, res) {
  const { email, seg } = req.query || {};

  if (!email || !seg) {
    return res.status(400).send(page("Error", `<div class="icon">⚠️</div><p class="h">Invalid link</p><p class="p">This unsubscribe link is invalid or expired.</p><a href="https://jadran.ai">← Back to JADRAN.AI</a>`));
  }

  const leadId = `${seg}_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

  await fsSet("mkt_leads", leadId, {
    unsubscribed: { booleanValue: true },
    updatedAt: { stringValue: new Date().toISOString() },
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(page("Unsubscribed", `
    <div class="icon">✅</div>
    <p class="h">You've been unsubscribed</p>
    <p class="p">You won't receive any more emails from JADRAN.AI.<br>You can still use the app anytime.</p>
    <a href="https://jadran.ai">← Back to JADRAN.AI</a>
  `));
}
