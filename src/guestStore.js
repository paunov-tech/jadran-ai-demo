// src/guestStore.js — Guest persistence (Firestore + localStorage fallback)
// Firestore: guests/{roomCode} → { profile, premium, lang, ... }
// localStorage: jadran_guest_{roomCode} → same shape (offline fallback)
import { db, hasConfig } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const COLLECTION = "guests";
const LS_PREFIX = "jadran_guest_";

// ─── LOCAL STORAGE HELPERS ───
function lsKey(roomCode) { return LS_PREFIX + (roomCode || "DEMO"); }

function lsRead(roomCode) {
  try {
    const raw = localStorage.getItem(lsKey(roomCode));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsWrite(roomCode, data) {
  try { localStorage.setItem(lsKey(roomCode), JSON.stringify(data)); } catch {}
}

// ─── FIRESTORE + FALLBACK ───

/** Load guest doc. Returns { profile, premium, lang, booked, ... } or null */
export async function loadGuest(roomCode) {
  const code = roomCode || "DEMO";

  // Try Firestore first
  if (db) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, code));
      if (snap.exists()) {
        const data = snap.data();
        lsWrite(code, data); // cache locally
        return data;
      }
    } catch (e) {
      console.warn("Firestore read failed, trying localStorage:", e.message);
    }
  }

  // Fallback to localStorage
  return lsRead(code);
}

/** Save full guest doc (initial create or overwrite) */
export async function saveGuest(roomCode, guestData) {
  const code = roomCode || "DEMO";
  const payload = { ...guestData, updatedAt: new Date().toISOString() };

  lsWrite(code, payload);

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION, code), {
        ...payload,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore write failed:", e.message);
    }
  }
}

/** Update specific fields (e.g., premium status) */
export async function updateGuest(roomCode, fields) {
  const code = roomCode || "DEMO";

  // Update localStorage
  const current = lsRead(code) || {};
  lsWrite(code, { ...current, ...fields, updatedAt: new Date().toISOString() });

  // Update Firestore
  if (db) {
    try {
      const ref = doc(db, COLLECTION, code);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, { ...fields, updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
      }
    } catch (e) {
      console.warn("Firestore update failed:", e.message);
    }
  }
}

/** Get roomCode from URL or localStorage */
export function getRoomCode() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("room");
  if (fromUrl) {
    try { localStorage.setItem("jadran_room", fromUrl); } catch {}
    return fromUrl;
  }
  try { return localStorage.getItem("jadran_room") || "DEMO"; } catch { return "DEMO"; }
}
