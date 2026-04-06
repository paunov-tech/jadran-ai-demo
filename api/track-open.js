// GET /api/track-open?lid=leadId&step=1
// Records email open event in Firestore, returns 1x1 transparent GIF.

const PROJECT = "molty-portal";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// 1x1 transparent GIF (binary-safe base64)
const GIF_B64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function strV(s) { return { stringValue: String(s) }; }

async function recordOpen(leadId, step) {
  // Append open event to mkt_opens collection (one doc per open)
  const openId = `${leadId}_s${step}_${Date.now()}`;
  await fetch(
    `${FS}/mkt_opens/${openId}?key=${process.env.VITE_FB_API_KEY}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          leadId: strV(leadId),
          step: strV(String(step)),
          openedAt: strV(new Date().toISOString()),
        },
      }),
    }
  ).catch(() => {});
}

export default async function handler(req, res) {
  const { lid, step = "0" } = req.query || {};
  if (lid) recordOpen(lid, step); // fire-and-forget

  const gif = Buffer.from(GIF_B64, "base64");
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  return res.status(200).send(gif);
}
