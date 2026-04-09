// One-time FB Page update — run: node scripts/update-fb-page.mjs
// Requires .env.local (vercel env pull .env.local --environment=production)

import { readFileSync } from "fs";

// Read .env.local
const env = {};
try {
  readFileSync(".env.local", "utf8").split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
  });
} catch {}

const PAGE_ID = process.env.META_PAGE_ID || env.META_PAGE_ID;
let TOKEN     = process.env.META_PAGE_TOKEN || env.META_PAGE_TOKEN;
const GRAPH   = "https://graph.facebook.com/v19.0";

if (!PAGE_ID || !TOKEN) { console.error("Missing META_PAGE_ID or META_PAGE_TOKEN"); process.exit(1); }

async function g(path, method = "GET", body = null) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${GRAPH}/${path}${sep}access_token=${TOKEN}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (data.error) console.warn(`  ⚠️  ${data.error.message}`);
  return data;
}

async function run() {
  console.log(`\n🔷 Updating Facebook Page ${PAGE_ID}...\n`);

  // ── 0. Exchange User Token → Page Access Token ───────────────────────────
  const pageTokenResp = await g(`${PAGE_ID}?fields=access_token,name,about,description,website,emails,category`);
  if (pageTokenResp.access_token) {
    TOKEN = pageTokenResp.access_token; // swap to page-scoped token
    console.log("✅ Swapped to Page Access Token");
  }

  // ── 1. Check current page info ──────────────────────────────────────────
  const info = pageTokenResp;
  console.log("Current page info:");
  console.log("  name:", info.name);
  console.log("  about:", info.about);
  console.log("  category:", info.category);
  console.log("  website:", info.website);
  console.log();

  // ── 2. Update page about, description, website, contact ─────────────────
  const update = await g(PAGE_ID, "POST", {
    about: "AI tourist guide for Croatia's Adriatic coast — hidden beaches, camper parking, sailing, restaurants. 8 languages. 3 messages free → jadran.ai",
    description:
      "JADRAN.AI is your personal AI concierge for the Croatian Adriatic coast.\n\n" +
      "🏖️ Hidden beaches & local restaurants\n" +
      "🚐 Camper van parking, dump stations & height restrictions\n" +
      "⛵ Sailing: ACI marinas, anchorages, NAVTEX & bura warnings\n" +
      "🚢 Cruise guide: shore excursions & local tips\n" +
      "🌦️ Real-time weather, sea temperature & storm alerts\n" +
      "🌍 Available in 8 languages: HR, DE, EN, IT, SL, CS, PL\n\n" +
      "3 messages free. Premium from €9.99/week.\n" +
      "👉 jadran.ai",
    website: "https://jadran.ai",
    emails: ["info@jadran.ai"],
    mission:
      "Making the Croatian Adriatic coast accessible to every traveller — campers, sailors, families and cruise passengers — with local knowledge powered by AI.",
  });
  console.log("✅ Page info updated:", update.success ? "success" : JSON.stringify(update));

  // ── 3. Upload cover photo from OG image URL ──────────────────────────────
  console.log("\n📸 Uploading cover photo...");
  const photoResp = await g(`${PAGE_ID}/photos`, "POST", {
    url: "https://jadran.ai/og-image.jpg",
    caption: "JADRAN.AI — AI turistički vodič za hrvatsku obalu Jadrana · jadran.ai",
    published: false,
  });
  console.log("  Photo upload:", JSON.stringify(photoResp));

  if (photoResp.id) {
    const coverResp = await g(PAGE_ID, "POST", {
      cover: JSON.stringify({ photo_id: photoResp.id }),
      no_feed_story: true,
    });
    console.log("✅ Cover photo set:", JSON.stringify(coverResp));
  }

  // ── 4. Upload profile picture from icon ─────────────────────────────────
  console.log("\n🖼️  Uploading profile picture...");
  const profilePic = await g(`${PAGE_ID}/photos`, "POST", {
    url: "https://jadran.ai/icon-1024.png",
    published: false,
  });
  console.log("  Profile pic upload:", JSON.stringify(profilePic));

  if (profilePic.id) {
    const picResp = await g(PAGE_ID, "POST", {
      picture: `https://jadran.ai/icon-1024.png`,
    });
    console.log("✅ Profile picture update:", JSON.stringify(picResp));
  }

  // ── 5. Create a Welcome post ─────────────────────────────────────────────
  console.log("\n📝 Creating welcome post...");
  const post = await g(`${PAGE_ID}/feed`, "POST", {
    message:
      "🌊 Dobrodošli na JADRAN.AI — vaš AI vodič za hrvatsku obalu!\n\n" +
      "Planirate ljetovanje na Jadranu? Pitajte našeg AI asistenta:\n" +
      "🏖️ Skrivene plaže koje turisti ne znaju\n" +
      "🚐 Parking za kampere i campervan rute\n" +
      "⛵ Marine, sidrišta i vremenski uvjeti za jedriličare\n" +
      "🍽️ Restorani koje preporučuju lokalni\n" +
      "🌦️ Stvarno stanje mora i upozorenja na buru\n\n" +
      "Dostupno na 8 jezika · 3 poruke besplatno · Premium od 9,99€/tjedan\n\n" +
      "👉 Isprobajte: jadran.ai",
    link: "https://jadran.ai",
    published: true,
  });
  console.log("✅ Welcome post:", post.id ? `published (${post.id})` : JSON.stringify(post));

  console.log("\n✅ Done!\n");
}

run().catch(console.error);
