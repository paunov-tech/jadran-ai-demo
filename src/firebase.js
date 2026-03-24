// src/firebase.js — JADRAN AI Firebase (shared molty-portal project)
// Uses "guests" collection — separate from ANVIL's portals/customers/materials
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

const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
const app = hasConfig ? initializeApp(firebaseConfig) : null;
const db = hasConfig ? getFirestore(app) : null;



export { db, hasConfig };
