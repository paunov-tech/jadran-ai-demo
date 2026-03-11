// src/firebase.js — JADRAN AI Firebase config
// Env vars: VITE_FB_API_KEY, VITE_FB_AUTH_DOMAIN, VITE_FB_PROJECT_ID,
//           VITE_FB_STORAGE, VITE_FB_MSG_ID, VITE_FB_APP_ID
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE,
  messagingSenderId: import.meta.env.VITE_FB_MSG_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// Only init if config exists (graceful fallback for dev without Firebase)
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = hasConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export { db, hasConfig };
