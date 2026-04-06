// POST /api/audience-sync
// Exports all lead emails (hashed) to:
//   1. Meta Custom Audience (Facebook/Instagram retargeting)
//   2. Google Customer Match (YouTube/Gmail/Search retargeting)
// Body: { secret }  OR  header x-cron-secret

const PROJECT = "molty-portal";
const FS_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Fetch all non-unsubscribed leads (up to 500 per run)
async function getLeadEmails() {
  const r = await fetch(`${FS_QUERY}?key=${process.env.VITE_FB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "mkt_leads" }],
        where: {
          fieldFilter: { field: { fieldPath: "unsubscribed" }, op: "EQUAL", value: { booleanValue: false } },
        },
        limit: 500,
      },
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return data
    .filter(d => d.document)
    .map(d => d.document.fields?.email?.stringValue)
    .filter(Boolean);
}

// ── Meta Custom Audience ─────────────────────────────────────────────────────
async function syncMeta(emails) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  const audienceId = process.env.META_AUDIENCE_ID;
  if (!pixelId || !token || !audienceId) return { skipped: true, reason: "META_AUDIENCE_ID not set" };

  const hashed = await Promise.all(emails.map(e => sha256hex(e)));

  const r = await fetch(
    `https://graph.facebook.com/v19.0/${audienceId}/users?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          schema: ["EMAIL_SHA256"],
          data: hashed.map(h => [h]),
        },
      }),
    }
  );
  const data = await r.json();
  return { ok: r.ok, added: data.num_received, invalid: data.num_invalid_entries };
}

// ── Google Customer Match ────────────────────────────────────────────────────
async function syncGoogle(emails) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const userListId = process.env.GOOGLE_ADS_USER_LIST_ID;
  const devToken = process.env.GOOGLE_ADS_DEV_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!customerId || !userListId || !devToken || !refreshToken) return { skipped: true, reason: "Google Ads env vars not set" };

  // Get access token
  const tokenR = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenR.ok) return { ok: false, reason: "Google OAuth failed" };
  const { access_token } = await tokenR.json();

  const hashed = await Promise.all(emails.map(e => sha256hex(e)));
  const operations = hashed.map(h => ({
    create: { userIdentifiers: [{ hashedEmail: h }] },
  }));

  const r = await fetch(
    `https://googleads.googleapis.com/v16/customers/${customerId}/offlineUserDataJobs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "developer-token": devToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job: { type: "CUSTOMER_MATCH_USER_LIST", customerMatchUserListMetadata: { userList: `customers/${customerId}/userLists/${userListId}` } },
      }),
    }
  );
  if (!r.ok) return { ok: false, reason: "Google job create failed" };
  const job = await r.json();
  const jobName = job.resourceName;

  // Add emails to job
  await fetch(`https://googleads.googleapis.com/v16/${jobName}:addOperations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "developer-token": devToken, "Content-Type": "application/json" },
    body: JSON.stringify({ operations }),
  });

  // Run job
  await fetch(`https://googleads.googleapis.com/v16/${jobName}:run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "developer-token": devToken },
  });

  return { ok: true, uploaded: emails.length };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const secret = req.body?.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

  const emails = await getLeadEmails();
  if (!emails.length) return res.status(200).json({ ok: true, emails: 0 });

  const [meta, google] = await Promise.all([
    syncMeta(emails).catch(e => ({ error: e.message })),
    syncGoogle(emails).catch(e => ({ error: e.message })),
  ]);

  return res.status(200).json({ ok: true, emails: emails.length, meta, google });
}
