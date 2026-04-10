// api/b2b-outreach.js — B2B Partner Outreach System
// Firestore collection: b2b_contacts (separate from mkt_leads — never mixes)
//
// Actions:
//   POST ?action=import   — bulk import contacts (CSV or JSON array)
//   POST ?action=send     — cron trigger: process due emails (called by cron-b2b)
//   POST ?action=add      — add single contact
//   GET  ?action=stats    — dashboard stats
//   POST ?action=pause    — pause a contact (unsubscribe / opt-out)
//
// Firestore schema — b2b_contacts/{contactId}:
//   email, name, objectName, type, city, region, lang
//   step (0=new, 1=email1_sent, 2=email2_sent, 3=email3_sent, 4=email4_sent, 5=done)
//   nextSendAt (timestamp ms), lastSentAt, createdAt
//   opened (bool), clicked (bool), registered (bool), paused (bool)
//   source (htc_registry | manual | csv | api)
//
// Email sequence (4 emails):
//   Email 1 (D+0):  Problem agitacija — "Vaši gosti pitaju 50x dnevno"
//   Email 2 (D+3):  Dokaz + social proof — "TZ Rab: 2300 posjetitelja za 4 dana"
//   Email 3 (D+7):  Konkretna ponuda — "Besplatno do 1. lipnja, setup 20 min"
//   Email 4 (D+14): Urgency + last chance — "Zadnja mjesta u vašoj regiji"

const PROJECT = "molty-portal";
const FS      = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FSQ     = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;
const FSC     = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:commit`;
const FB_KEY  = () => process.env.FIREBASE_API_KEY || process.env.VITE_FB_API_KEY;
const RESEND  = () => process.env.RESEND_API_KEY;
const FROM_B2B = "Jadran AI Partnerstvo <partneri@jadran.ai>";
const PARTNER_URL = "https://jadran.ai/partner?action=register";
const UNSUBSCRIBE_URL = (email, id) =>
  `https://jadran.ai/api/b2b-outreach?action=pause&email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`;

// Delays in hours
const DELAYS = [0, 72, 168, 336]; // D+0, D+3, D+7, D+14

// ── FIRESTORE HELPERS ─────────────────────────────────────────────────────
function strV(s)  { return { stringValue: String(s ?? "") }; }
function intV(n)  { return { integerValue: String(n ?? 0) }; }
function boolV(b) { return { booleanValue: !!b }; }
function tsV(ms)  { return { timestampValue: new Date(ms).toISOString() }; }

function fromDoc(doc) {
  const f = doc.fields || {};
  const get = (k, type) => {
    const v = f[k];
    if (!v) return null;
    if (type === "str")  return v.stringValue ?? null;
    if (type === "int")  return parseInt(v.integerValue ?? "0");
    if (type === "bool") return v.booleanValue ?? false;
    if (type === "ts")   return v.timestampValue ? new Date(v.timestampValue).getTime() : null;
    return null;
  };
  return {
    id:         doc.name.split("/").pop(),
    email:      get("email",      "str"),
    name:       get("name",       "str"),
    objectName: get("objectName", "str"),
    type:       get("type",       "str"),
    city:       get("city",       "str"),
    region:     get("region",     "str"),
    lang:       get("lang",       "str") || "hr",
    step:       get("step",       "int") ?? 0,
    nextSendAt: get("nextSendAt", "ts"),
    lastSentAt: get("lastSentAt", "ts"),
    createdAt:  get("createdAt",  "ts"),
    opened:     get("opened",     "bool"),
    clicked:    get("clicked",    "bool"),
    registered: get("registered", "bool"),
    paused:     get("paused",     "bool"),
    source:     get("source",     "str"),
    capacity:   get("capacity",   "int"),
    tier:       get("tier",       "str"),
    phone:      get("phone",      "str"),
    address:    get("address",    "str"),
  };
}

async function fsGet(col, id) {
  try {
    const r = await fetch(`${FS}/${col}/${id}?key=${FB_KEY()}`);
    if (!r.ok) return null;
    const doc = await r.json();
    return doc.fields ? fromDoc(doc) : null;
  } catch { return null; }
}

async function fsPatch(col, id, fields) {
  try {
    const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const r = await fetch(
      `${FS}/${col}/${id}?key=${FB_KEY()}&${mask}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok;
  } catch { return false; }
}

async function fsQuery(filters, limit = 100) {
  try {
    const r = await fetch(`${FSQ}?key=${FB_KEY()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "b2b_contacts" }],
          where: filters.length === 1 ? filters[0] : { compositeFilter: { op: "AND", filters } },
          limit,
        },
      }),
    });
    if (!r.ok) return null; // null = query failed (quota/error), vs [] = genuinely empty
    const data = await r.json();
    return data.filter(d => d.document).map(d => fromDoc(d.document));
  } catch { return null; }
}

// Returns raw Firestore field map (fieldName -> JS value), for meta/stats docs
async function fsGetFields(col, id) {
  try {
    const r = await fetch(`${FS}/${col}/${id}?key=${FB_KEY()}`);
    if (!r.ok) return null;
    const doc = await r.json();
    const f = doc.fields;
    if (!f) return null;
    const out = {};
    for (const [k, v] of Object.entries(f)) {
      if (v.integerValue !== undefined) out[k] = parseInt(v.integerValue);
      else if (v.stringValue  !== undefined) out[k] = v.stringValue;
      else if (v.booleanValue !== undefined) out[k] = v.booleanValue;
    }
    return out;
  } catch { return null; }
}

// Atomically increments fields in a Firestore doc (creates the doc if it doesn't exist)
async function fsIncrement(col, id, deltas) {
  const docPath = `projects/${PROJECT}/databases/(default)/documents/${col}/${id}`;
  const fieldTransforms = Object.entries(deltas).map(([fieldPath, n]) => ({
    fieldPath,
    increment: { integerValue: String(n) },
  }));
  try {
    const r = await fetch(`${FSC}?key=${FB_KEY()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ transform: { document: docPath, fieldTransforms } }] }),
    });
    return r.ok;
  } catch { return false; }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────
function contactId(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60);
}

// Greeting helper
function greeting(lang, name) {
  const obj = name || (lang === "de" ? "Sehr geehrte Damen und Herren" : lang === "en" ? "Dear partner" : "Poštovani");
  return lang === "de" ? `Sehr geehrte/r ${name || ""},`
    : lang === "en" ? `Dear ${name || "partner"},`
    : `Poštovani${name ? ` ${name}` : ""},`;
}

function baseHtml(content, email, id, lang) {
  const unsub = UNSUBSCRIBE_URL(email, id);
  const pixel = `<img src="https://jadran.ai/api/b2b-outreach?action=open_pixel&id=${id}" width="1" height="1" style="display:none" alt="">`;
  const footerText = lang === "de"
    ? `Sie erhalten diese E-Mail, weil Ihr Betrieb in der HTZ-Datenbank registriert ist. <a href="${unsub}" style="color:#64748b">Abmelden</a>`
    : lang === "en"
    ? `You receive this email because your business is in the HTZ registry. <a href="${unsub}" style="color:#64748b">Unsubscribe</a>`
    : `Primate ovu poruku jer je vaš objekt registriran u HTZ bazi. <a href="${unsub}" style="color:#64748b">Odjava</a>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width:580px; margin:0 auto; }
  .header { background:linear-gradient(135deg,#04090f,#0a1628); padding:28px 32px; border-radius:12px 12px 0 0; }
  .logo { font-family:Georgia,serif; font-size:22px; font-weight:700; color:#fff; }
  .logo span { color:#0ea5e9; }
  .body { background:#fff; padding:36px 32px; }
  .footer { background:#f8fafc; padding:20px 32px; border-radius:0 0 12px 12px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; }
  .cta { display:inline-block; background:#0ea5e9; color:#fff !important; padding:14px 32px; border-radius:50px; text-decoration:none; font-weight:700; font-size:16px; margin:20px 0; }
  .highlight { background:#f0f9ff; border-left:3px solid #0ea5e9; padding:14px 18px; border-radius:0 8px 8px 0; margin:20px 0; }
  .stat { display:inline-block; background:#0a1628; color:#e2f0ff; border-radius:8px; padding:10px 20px; margin:6px 4px; font-size:14px; }
  .stat strong { color:#0ea5e9; font-size:20px; display:block; }
  p { color:#334155; line-height:1.7; font-size:15px; margin:12px 0; }
  h2 { color:#0a1628; font-size:22px; margin:0 0 16px; }
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">JADRAN<span>.ai</span></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:2px;text-transform:uppercase">Partner Program 2026</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">${footerText}<br>${pixel}</div>
</div></body></html>`;
}

// ── 4 EMAIL TEMPLATES ─────────────────────────────────────────────────────
function email1(contact) {
  const { lang, name, objectName, city, id, email } = contact;
  const ctaUrl = `${PARTNER_URL}&utm_source=b2b_email&utm_medium=email&utm_campaign=email1&ref=${id}`;

  const tmpl = {
    hr: {
      subject: `${objectName || city || "Vaš objekt"} — besplatni AI vodič za vaše goste`,
      body: `<h2>Vaši gosti pitaju. Vaše osoblje odgovara ručno. Svaki dan.</h2>
<p>${greeting(lang, name)}</p>
<p>Koliko puta dnevno vaši gosti pitaju: "Gdje je dobra plaža?", "Ima li parking za kamper?", "Koji je restoran otvoren?", "Kako doći do...?"</p>
<p>Za većinu objekata na Jadranu — odgovor je <strong>30 do 50 puta dnevno</strong>. Na 8 različitih jezika.</p>
<div class="highlight"><strong>Jadran AI rješava ovaj problem za 20 minuta.</strong><br>Jedan QR kod na recepciji. Gost skenira, otvori AI vodiča na svom jeziku, pita što želi. Vi ne trebate ništa.</div>
<p>Potpuno besplatno do 1. lipnja 2026.</p>
<a href="${ctaUrl}" class="cta">Pogledajte kako funkcionira →</a>
<p style="font-size:13px;color:#94a3b8">Setup traje 20 minuta. Bez tehničkog znanja. Bez kartice.</p>`,
    },
    de: {
      subject: `${objectName || city || "Ihr Betrieb"} — kostenloser KI-Reiseführer für Ihre Gäste`,
      body: `<h2>Ihre Gäste fragen. Ihr Personal antwortet manuell. Täglich.</h2>
<p>${greeting(lang, name)}</p>
<p>Wie oft fragen Ihre Gäste täglich: "Wo ist ein guter Strand?", "Gibt es Wohnmobil-Parkplätze?", "Welches Restaurant hat offen?", "Wie komme ich zu...?"</p>
<p>Für die meisten Betriebe an der Adria — die Antwort ist <strong>30 bis 50 Mal täglich</strong>. In 8 verschiedenen Sprachen.</p>
<div class="highlight"><strong>Jadran AI löst dieses Problem in 20 Minuten.</strong><br>Ein QR-Code an der Rezeption. Der Gast scannt, öffnet den KI-Guide in seiner Sprache, fragt was er will. Sie müssen nichts tun.</div>
<p>Komplett kostenlos bis 1. Juni 2026.</p>
<a href="${ctaUrl}" class="cta">So funktioniert es →</a>
<p style="font-size:13px;color:#94a3b8">Setup dauert 20 Minuten. Kein technisches Wissen. Keine Kreditkarte.</p>`,
    },
    en: {
      subject: `${objectName || city || "Your property"} — free AI guide for your guests`,
      body: `<h2>Your guests ask. Your staff answers manually. Every day.</h2>
<p>${greeting(lang, name)}</p>
<p>How many times a day do your guests ask: "Where's a good beach?", "Is there camper parking?", "Which restaurant is open?", "How do I get to...?"</p>
<p>For most properties on the Adriatic — the answer is <strong>30 to 50 times daily</strong>. In 8 different languages.</p>
<div class="highlight"><strong>Jadran AI solves this in 20 minutes.</strong><br>One QR code at reception. Guest scans, opens AI guide in their language, asks what they want. You do nothing.</div>
<p>Completely free until June 1st 2026.</p>
<a href="${ctaUrl}" class="cta">See how it works →</a>
<p style="font-size:13px;color:#94a3b8">20-minute setup. No technical knowledge. No credit card.</p>`,
    },
  };

  const t = tmpl[lang] || tmpl.hr;
  return { subject: t.subject, html: baseHtml(t.body, email, id, lang) };
}

function email2(contact) {
  const { lang, name, objectName, city, id, email } = contact;
  const ctaUrl = `${PARTNER_URL}&utm_source=b2b_email&utm_medium=email&utm_campaign=email2&ref=${id}`;

  const tmpl = {
    hr: {
      subject: "Rezultati TZ Rab: 2.300 gostiju za 4 dana",
      body: `<h2>Evo što su postigli na otoku Rabu.</h2>
<p>${greeting(lang, name)}</p>
<p>Prije 3 dana smo vam poslali informaciju o Jadran AI. Danas vam šaljemo konkretne brojeve.</p>
<div style="text-align:center;margin:24px 0">
  <div class="stat"><strong>2.300+</strong>gostiju u 4 dana</div>
  <div class="stat"><strong>82%</strong>s mobitela</div>
  <div class="stat"><strong>€0.07</strong>cijena po posjetu</div>
  <div class="stat"><strong>8</strong>jezika</div>
</div>
<div class="highlight">"Za 4 dana kampanje — 2.300+ posjetitelja. Naši gosti sami dolaze do informacija. Osoblje manje pita, gosti su zadovoljniji." <br><strong>— TZ Rab</strong></div>
<p>TZ Rab je naš pilot partner. Rezultati su stvarni, podaci su iz Plausible Analytics.</p>
<p>Vaši gosti iz Njemačke, Austrije, Italije i Slovačke mogu dobiti isti vodič — za vaš objekt, na vašem jeziku.</p>
<a href="${ctaUrl}" class="cta">Aktivirajte za svoj objekt →</a>`,
    },
    de: {
      subject: "TZ Rab Ergebnisse: 2.300 Gäste in 4 Tagen",
      body: `<h2>Das haben sie auf der Insel Rab erreicht.</h2>
<p>${greeting(lang, name)}</p>
<p>Vor 3 Tagen haben wir Ihnen Informationen über Jadran AI geschickt. Heute schicken wir Ihnen konkrete Zahlen.</p>
<div style="text-align:center;margin:24px 0">
  <div class="stat"><strong>2.300+</strong>Gäste in 4 Tagen</div>
  <div class="stat"><strong>82%</strong>Mobil-Nutzer</div>
  <div class="stat"><strong>€0,07</strong>Kosten pro Besuch</div>
  <div class="stat"><strong>8</strong>Sprachen</div>
</div>
<div class="highlight">"In 4 Tagen der Kampagne — 2.300+ Besucher. Unsere Gäste kommen selbst an Informationen. Das Personal wird weniger gefragt, die Gäste sind zufriedener." <br><strong>— TZ Rab</strong></div>
<p>TZ Rab ist unser Pilotpartner. Die Ergebnisse sind real, die Daten stammen aus Plausible Analytics.</p>
<a href="${ctaUrl}" class="cta">Für Ihren Betrieb aktivieren →</a>`,
    },
    en: {
      subject: "TZ Rab results: 2,300 guests in 4 days",
      body: `<h2>Here's what they achieved on Rab island.</h2>
<p>${greeting(lang, name)}</p>
<p>3 days ago we sent you information about Jadran AI. Today we're sending you concrete numbers.</p>
<div style="text-align:center;margin:24px 0">
  <div class="stat"><strong>2,300+</strong>guests in 4 days</div>
  <div class="stat"><strong>82%</strong>mobile users</div>
  <div class="stat"><strong>€0.07</strong>cost per visit</div>
  <div class="stat"><strong>8</strong>languages</div>
</div>
<div class="highlight">"In 4 days of the campaign — 2,300+ visitors. Our guests find information on their own. Staff gets fewer questions, guests are happier." <br><strong>— TZ Rab</strong></div>
<a href="${ctaUrl}" class="cta">Activate for your property →</a>`,
    },
  };

  const t = tmpl[lang] || tmpl.hr;
  return { subject: t.subject, html: baseHtml(t.body, email, id, lang) };
}

function email3(contact) {
  const { lang, name, objectName, city, id, email, type } = contact;
  const ctaUrl = `${PARTNER_URL}&utm_source=b2b_email&utm_medium=email&utm_campaign=email3&ref=${id}`;

  const typeLabel = {
    hr: { kamp:"kampovi", smještaj:"smještajni objekti", restoran:"restorani", konoba:"konobe", marina:"marine", default:"objekti" },
    de: { kamp:"Campingplätze", smještaj:"Unterkünfte", restoran:"Restaurants", konoba:"Tavernen", marina:"Marinas", default:"Betriebe" },
    en: { kamp:"campsites", smještaj:"accommodations", restoran:"restaurants", konoba:"taverns", marina:"marinas", default:"properties" },
  };
  const tl = typeLabel[lang] || typeLabel.hr;
  const typeStr = tl[type] || tl.default;

  const tmpl = {
    hr: {
      subject: "Konkretna ponuda: besplatno do 1. lipnja",
      body: `<h2>Evo točno što dobivate — i što to košta.</h2>
<p>${greeting(lang, name)}</p>
<p>Do sada smo vam pokazali problem i dokaze. Sada vam pokazujemo cijene.</p>
<div class="highlight">
  <strong>BESPLATNO do 1. lipnja 2026</strong><br>
  • QR kod za ${objectName || "vaš objekt"}<br>
  • Dashboard s analitikom u realnom vremenu<br>
  • Do 300 skeniranja/mj<br>
  • Bez kartice, bez obaveze
</div>
<p>Nakon 1. lipnja — <strong>€1.000 za cijelu sezonu</strong> (lipanj–listopad). Fiksna cijena, nema iznenađenja.</p>
<p>Usporedba: jedan gost koji ostane dan dulje zbog bolje informiranosti = €80–150 prihoda. Jadran AI se isplati već prvog tjedna.</p>
<p>Do sada su se prijavili ${typeStr} iz Raba, Rovinja, Splita i Dubrovnika. Slobodnih mjesta u vašoj regiji (${city || "vaš kraj"}) još ima.</p>
<a href="${ctaUrl}" class="cta">Registrirajte se besplatno →</a>
<p style="font-size:13px;color:#94a3b8">Setup: 20 minuta. Aktivacija: odmah.</p>`,
    },
    de: {
      subject: "Konkretes Angebot: kostenlos bis 1. Juni",
      body: `<h2>Genau was Sie bekommen — und was es kostet.</h2>
<p>${greeting(lang, name)}</p>
<div class="highlight">
  <strong>KOSTENLOS bis 1. Juni 2026</strong><br>
  • QR-Code für ${objectName || "Ihren Betrieb"}<br>
  • Dashboard mit Echtzeit-Analytics<br>
  • Bis 300 Scans/Monat<br>
  • Keine Kreditkarte, keine Verpflichtung
</div>
<p>Ab 1. Juni — <strong>€1.000 für die gesamte Saison</strong> (Juni–Oktober). Fixpreis, keine Überraschungen.</p>
<p>Bisher haben sich ${typeStr} aus Rab, Rovinj, Split und Dubrovnik angemeldet.</p>
<a href="${ctaUrl}" class="cta">Kostenlos registrieren →</a>`,
    },
    en: {
      subject: "Concrete offer: free until June 1st",
      body: `<h2>Exactly what you get — and what it costs.</h2>
<p>${greeting(lang, name)}</p>
<div class="highlight">
  <strong>FREE until June 1st 2026</strong><br>
  • QR code for ${objectName || "your property"}<br>
  • Real-time analytics dashboard<br>
  • Up to 300 scans/month<br>
  • No credit card, no commitment
</div>
<p>After June 1st — <strong>€1,000 for the full season</strong> (June–October). Fixed price, no surprises.</p>
<a href="${ctaUrl}" class="cta">Register for free →</a>`,
    },
  };

  const t = tmpl[lang] || tmpl.hr;
  return { subject: t.subject, html: baseHtml(t.body, email, id, lang) };
}

function email4(contact) {
  const { lang, name, objectName, city, id, email } = contact;
  const ctaUrl = `${PARTNER_URL}&utm_source=b2b_email&utm_medium=email&utm_campaign=email4&ref=${id}`;

  const tmpl = {
    hr: {
      subject: `Zadnja poruka — i jedno konkretno pitanje`,
      body: `<h2>Zadnji put se javljamo.</h2>
<p>${greeting(lang, name)}</p>
<p>Poslali smo vam 3 poruke o Jadran AI-u. Niste se registrirali.</p>
<p>To je u redu — možda nije pravi trenutak, možda nije pravi fit.</p>
<p>Ali imam jedno pitanje: <strong>koji je razlog?</strong></p>
<p>Je li to:<br>
– Nedostaje informacija? (Odgovorit ćemo odmah)<br>
– Tehnički problemi? (Pomažemo vam s postavljanjem)<br>
– Cijena? (Besplatno do lipnja — bez rizika)<br>
– Nešto drugo?</p>
<p>Samo odgovorite na ovaj email. Čitamo svaki odgovor.</p>
<p>Ako vas ne zanima više — slobodno kliknite "Odjava" ispod. Nećemo više pisati.</p>
<a href="${ctaUrl}" class="cta">Ili — registrirajte se sad →</a>`,
    },
    de: {
      subject: `Letzte Nachricht — und eine konkrete Frage`,
      body: `<h2>Wir melden uns zum letzten Mal.</h2>
<p>${greeting(lang, name)}</p>
<p>Wir haben Ihnen 3 Nachrichten über Jadran AI geschickt. Sie haben sich nicht registriert.</p>
<p>Das ist in Ordnung — vielleicht ist es nicht der richtige Zeitpunkt.</p>
<p>Aber ich habe eine Frage: <strong>Was ist der Grund?</strong></p>
<p>Fehlen Informationen? Technische Fragen? Preis? Etwas anderes?</p>
<p>Antworten Sie einfach auf diese E-Mail. Wir lesen jede Antwort.</p>
<a href="${ctaUrl}" class="cta">Oder — jetzt registrieren →</a>`,
    },
    en: {
      subject: `Last message — and one concrete question`,
      body: `<h2>We're reaching out one last time.</h2>
<p>${greeting(lang, name)}</p>
<p>We've sent you 3 messages about Jadran AI. You haven't registered.</p>
<p>That's fine — maybe it's not the right time.</p>
<p>But I have one question: <strong>What's the reason?</strong></p>
<p>Missing information? Technical questions? Price? Something else?</p>
<p>Just reply to this email. We read every reply.</p>
<a href="${ctaUrl}" class="cta">Or — register now →</a>`,
    },
  };

  const t = tmpl[lang] || tmpl.hr;
  return { subject: t.subject, html: baseHtml(t.body, email, id, lang) };
}

const EMAIL_FNS = [null, email1, email2, email3, email4];

// ── SEND EMAIL VIA RESEND ─────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  const key = RESEND();
  if (!key) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_B2B, to, subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

// ── ACTIONS ───────────────────────────────────────────────────────────────
async function actionAdd(body) {
  const { email, name, objectName, type, city, region, lang, source, capacity, tier, phone, address } = body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) return { ok: false, error: "Invalid email" };

  const id = contactId(email);
  const existing = await fsGet("b2b_contacts", id);
  if (existing && !existing.paused) return { ok: false, error: "Already exists", id };

  const now = Date.now();
  const ok = await fsPatch("b2b_contacts", id, {
    email:      strV(email),
    name:       strV(name || ""),
    objectName: strV(objectName || ""),
    type:       strV(type || "smještaj"),
    city:       strV(city || ""),
    region:     strV(region || ""),
    lang:       strV(lang || "hr"),
    step:       intV(0),
    nextSendAt: tsV(now),  // send first email immediately
    createdAt:  tsV(now),
    opened:     boolV(false),
    clicked:    boolV(false),
    registered: boolV(false),
    paused:     boolV(false),
    source:     strV(source || "manual"),
    capacity:   intV(capacity || 0),
    tier:       strV(tier || "C"),
    phone:      strV(phone || ""),
    address:    strV(address || ""),
  });
  if (!ok) return { ok: false, error: "Firestore write failed" };

  // Increment stats meta-doc (atomic, non-blocking)
  const typeKey = `type_${(type || "smještaj").replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
  const langKey = `lang_${(lang || "hr").replace(/[^a-z0-9]/g, "_")}`;
  const tierKey = `tier_${(tier || "C")}`;
  const regionKey = `region_${(region || "unknown").replace(/[^a-z0-9]/g, "_")}`;
  fsIncrement("b2b_contacts", "__stats", { total: 1, step_0: 1, [typeKey]: 1, [langKey]: 1, [tierKey]: 1, [regionKey]: 1 }).catch(() => {});

  return { ok: true, id, scheduled: true };
}

async function actionImport(body) {
  // Accepts: { contacts: [{email, name, objectName, type, city, region, lang}] }
  const { contacts, source } = body;
  if (!Array.isArray(contacts)) return { ok: false, error: "contacts must be array" };

  let added = 0, skipped = 0, errors = 0;

  // Process in batches of 10 (Vercel 30s limit)
  const batch = contacts.slice(0, 200); // max 200 per call
  for (const c of batch) {
    if (!c.email) { errors++; continue; }
    const r = await actionAdd({ ...c, source: source || "csv" });
    if (r.ok) added++;
    else if (r.error === "Already exists") skipped++;
    else errors++;
  }

  return { ok: true, added, skipped, errors, total: batch.length };
}

async function actionSend() {
  // Called by cron every 6h — process contacts whose nextSendAt has passed
  const now = Date.now();

  // Fetch all active contacts, filter in JS (avoids Firestore composite index requirement)
  const all = await fsQuery([
    { fieldFilter: { field: { fieldPath: "paused" }, op: "EQUAL", value: boolV(false) } },
  ], 200);

  if (!all) return { ok: false, error: "Firestore quota exceeded — cron skipped", sent: 0, failed: 0, skipped: 0, processed: 0 };

  const due = all
    .filter(c => !c.registered && (c.step || 0) < 5 && c.nextSendAt && c.nextSendAt <= now)
    .slice(0, 50);

  let sent = 0, failed = 0, skipped = 0;

  for (const contact of due) {
    const nextStep = (contact.step || 0) + 1;
    if (nextStep > 4) {
      // Sequence complete — mark done
      await fsPatch("b2b_contacts", contact.id, { step: intV(5) });
      skipped++;
      continue;
    }

    const emailFn = EMAIL_FNS[nextStep];
    if (!emailFn) { skipped++; continue; }

    const { subject, html } = emailFn(contact);
    const ok = await sendEmail(contact.email, subject, html);

    if (ok) {
      const nextDelay = DELAYS[nextStep] || 336; // hours until next email
      await fsPatch("b2b_contacts", contact.id, {
        step:       intV(nextStep),
        lastSentAt: tsV(now),
        nextSendAt: tsV(now + nextDelay * 3600000),
      });
      sent++;
    } else {
      failed++;
    }

    // Rate limit: small delay between sends
    await new Promise(r => setTimeout(r, 100));
  }

  return { ok: true, sent, failed, skipped, processed: due.length };
}

async function actionStats() {
  // Fast path: read pre-aggregated meta-doc (1 point read, immune to runQuery quota)
  const meta = await fsGetFields("b2b_contacts", "__stats");
  if (meta && (meta.total || 0) > 0) {
    const stats = { total: meta.total || 0, byStep: {}, opened: 0, clicked: 0, registered: 0, byLang: {}, byType: {}, byTier: {}, byRegion: {} };
    for (const [k, v] of Object.entries(meta)) {
      if (k.startsWith("step_"))   stats.byStep[k.slice(5)]   = v;
      else if (k.startsWith("lang_"))   stats.byLang[k.slice(5)]   = v;
      else if (k.startsWith("type_"))   stats.byType[k.slice(5)]   = v;
      else if (k.startsWith("tier_"))   stats.byTier[k.slice(5)]   = v;
      else if (k.startsWith("region_")) stats.byRegion[k.slice(7)] = v;
    }
    return { ok: true, stats, source: "meta" };
  }

  // Fallback: full collection scan (requires quota — works on Blaze after reset)
  const all = await fsQuery([
    { fieldFilter: { field: { fieldPath: "paused" }, op: "EQUAL", value: boolV(false) } },
  ], 500);

  if (!all) return { ok: false, error: "Quota exceeded — try again later or check Firestore billing", stats: { total: 0 } };

  const stats = { total: all.length, byStep: {}, opened: 0, clicked: 0, registered: 0, byLang: {}, byType: {}, byTier: {}, byRegion: {} };
  for (const c of all) {
    const s = String(c.step || 0);
    stats.byStep[s] = (stats.byStep[s] || 0) + 1;
    if (c.opened)     stats.opened++;
    if (c.clicked)    stats.clicked++;
    if (c.registered) stats.registered++;
    if (c.lang)   stats.byLang[c.lang]     = (stats.byLang[c.lang]     || 0) + 1;
    if (c.type)   stats.byType[c.type]     = (stats.byType[c.type]     || 0) + 1;
    if (c.tier)   stats.byTier[c.tier]     = (stats.byTier[c.tier]     || 0) + 1;
    if (c.region) stats.byRegion[c.region] = (stats.byRegion[c.region] || 0) + 1;
  }

  // Cache result in meta-doc so future calls don't need runQuery
  if (stats.total > 0) {
    const fields = { total: intV(stats.total) };
    for (const [k,v] of Object.entries(stats.byStep))   fields[`step_${k}`]     = intV(v);
    for (const [k,v] of Object.entries(stats.byLang))   fields[`lang_${k}`]     = intV(v);
    for (const [k,v] of Object.entries(stats.byType))   fields[`type_${k.replace(/[^a-z0-9]/gi,"_").toLowerCase()}`] = intV(v);
    for (const [k,v] of Object.entries(stats.byTier))   fields[`tier_${k}`]     = intV(v);
    for (const [k,v] of Object.entries(stats.byRegion)) fields[`region_${k.replace(/[^a-z0-9]/g,"_")}`] = intV(v);
    fsPatch("b2b_contacts", "__stats", fields).catch(() => {});
  }

  return { ok: true, stats };
}

async function actionList(query) {
  const { region, type, tier, step, search } = query;

  const filters = [
    { fieldFilter: { field: { fieldPath: "paused" }, op: "EQUAL", value: boolV(false) } },
  ];
  if (region && region !== "all") filters.push({ fieldFilter: { field: { fieldPath: "region" }, op: "EQUAL", value: strV(region) } });
  if (tier   && tier   !== "all") filters.push({ fieldFilter: { field: { fieldPath: "tier"   }, op: "EQUAL", value: strV(tier)   } });
  // type filter: must be last — Firestore needs only one inequality, all others EQUAL
  if (type   && type   !== "all") filters.push({ fieldFilter: { field: { fieldPath: "type"   }, op: "EQUAL", value: strV(type)   } });

  const contacts = await fsQuery(filters, 500);

  if (!contacts) return { ok: false, error: "quota_exceeded", contacts: [], message: "Firestore runQuery kvota iscrpljena — kontakti će biti dostupni nakon aktivacije Blaze plana" };

  let result = contacts;
  if (step !== undefined && step !== "all") {
    const stepNum = parseInt(step);
    result = result.filter(c => (c.step || 0) === stepNum);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      (c.email      || "").toLowerCase().includes(q) ||
      (c.objectName || "").toLowerCase().includes(q) ||
      (c.city       || "").toLowerCase().includes(q)
    );
  }

  return { ok: true, contacts: result, total: result.length };
}

async function actionPause(query) {
  const { email, id } = query;
  const docId = id || (email ? contactId(email) : null);
  if (!docId) return { ok: false, error: "Missing id or email" };

  await fsPatch("b2b_contacts", docId, { paused: boolV(true) });
  return { ok: true, message: "Contact paused (unsubscribed)" };
}

async function actionOpenPixel(query) {
  const { id } = query;
  if (id) await fsPatch("b2b_contacts", id, { opened: boolV(true) }).catch(() => {});
  // Return 1x1 transparent GIF
  return "pixel";
}

// ── HANDLER ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action || req.body?.action;

  // Open pixel — no auth
  if (action === "open_pixel") {
    const result = await actionOpenPixel(req.query);
    if (result === "pixel") {
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    }
    return res.json(result);
  }

  // Unsubscribe — no auth (GET link from email)
  if (action === "pause" && req.method === "GET") {
    const result = await actionPause(req.query);
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;color:#334155">
      <h2>✓ ${result.ok ? "Odjavljeni ste" : "Greška"}</h2>
      <p>${result.ok ? "Više nećete primati poruke od Jadran AI." : result.error}</p>
    </body></html>`);
  }

  // Admin auth — identičan pattern kao bookings.js
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN) return res.status(503).json({ ok: false, error: "not_configured" });
  const _raw = req.headers["x-admin-token"] || "";
  const _tok = (() => { try { return Buffer.from(_raw, "base64").toString("utf8"); } catch { return _raw; } })();
  const CRON_SECRET = process.env.CRON_SECRET || "";
  const isCron = req.headers["x-vercel-cron"] === "1" ||
                 req.headers.authorization === `Bearer ${CRON_SECRET}`;
  if (!isCron && (!_tok || _tok.trim() !== ADMIN_TOKEN.trim())) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    let result;
    if (action === "import") result = await actionImport(req.body || {});
    else if (action === "add")   result = await actionAdd(req.body || {});
    else if (action === "send")  result = await actionSend();
    else if (action === "stats") result = await actionStats();
    else if (action === "list")  result = await actionList(req.query);
    else if (action === "pause") result = await actionPause(req.body || req.query);
    else if (action === "whoami") result = {
      ok: true,
      raw_len: _raw.length,
      decoded_preview: _tok.slice(0, 4) + "***",
      admin_len: ADMIN_TOKEN.length,
      match: _tok.trim() === ADMIN_TOKEN.trim(),
    };
    else result = { ok: false, error: `Unknown action: ${action}` };

    res.json(result);
  } catch (e) {
    console.error("[b2b-outreach]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
}
