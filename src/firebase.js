// src/firebase.js — JADRAN AI Firebase (shared molty-portal project)
// Uses "guests" collection — separate from ANVIL's portals/customers/materials
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "AIzaSyDertBFBwHCgf_iiucApWtlhB66va1OvYM",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "molty-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "molty-portal",
  storageBucket: import.meta.env.VITE_FB_STORAGE || "molty-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FB_MSG_ID || "1010121862220",
  appId: import.meta.env.VITE_FB_APP_ID || "1:1010121862220:web:fc08a0aa51ca0415e058e9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const hasConfig = true; // Always true — hardcoded fallback



export { db, hasConfig };
