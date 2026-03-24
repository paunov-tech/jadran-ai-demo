# JADRAN.AI — Production Readiness Checklist
**Status:** Pre-production · March 24, 2026

## CRITICAL — App breaks if not fixed

### 1. Arrival Geofence hardcoded to Podstrana
**File:** App.jsx L1159
**Problem:** `const DEST = { lat: 43.4892, lng: 16.5523 }; // Podstrana`
**Fix:** Read from `delta.destination` or `transitToCoords`

### 2. Weather API called without coordinates  
**File:** App.jsx L982
**Problem:** `fetch("/api/weather")` — no lat/lng params, defaults to Podstrana
**Fix:** Pass `kioskCoords` or `transitToCoords` → `/api/weather?lat=X&lon=Y`
**Note:** API already supports params, just nobody passes them

### 3. MAP_COORDS + openGoogleMaps hardcoded
**File:** App.jsx L419-445
**Problem:** 20 hardcoded Podstrana/Split locations (villa_parking, kasjuni, konzum...)
**Fix:** Remove MAP_COORDS, use lat/lng from HERE Discover results directly

### 4. PRACTICAL data still used as fallback
**File:** App.jsx L488-522
**Problem:** sun/emergency/routes still render hardcoded Podstrana data
**Fix:** Make sun/emergency generic (UV, 112, pharmacy from nearby), routes from HERE

## HIGH — User sees wrong/broken content

### 5. GEMS hardcoded to Split area
**File:** App.jsx L524-590  
**Problem:** 6 gems (Vruja, Marjan, Klis, Cetina, Vidova Gora, Stari Mlin) all Split-area
**Fix:** Phase 1: hide gems if not in Split area. Phase 2: AI generates gems per location

### 6. EXPERIENCES hardcoded
**File:** App.jsx L592-660
**Problem:** 6 experiences all Split/Dalmatia (Dioklecijanova, Krka, Cetina...)  
**Fix:** Phase 1: hide if not in Split. Phase 2: Viator/GYG search by location

### 7. GUEST_FALLBACK with dummy data
**File:** App.jsx L460-470
**Problem:** budget:1200, spent:340, kids:0, host:"Domaćin", phone:"+385 91 000 0000"
**Fix:** Remove budget/spent tracking (already removed card), clean up fallback

### 8. Post-Stay references G.spent and hardcoded "7 days"
**File:** App.jsx L2269
**Problem:** `7 daysStay · {booked} activitiesDone · {G.spent}€`
**Fix:** Dynamic stay duration, remove spent reference

### 9. ACCOMMODATION list hardcoded
**File:** App.jsx L562-590
**Problem:** 7 hardcoded regions (Split, Makarska, Hvar, Rovinj, Pula, Opatija, Krk)
**Fix:** Keep as static content (these are affiliate links, not location-specific)

## MEDIUM — Polish needed

### 10. HostPanel hardcoded to Podstrana
**File:** HostPanel.jsx L243-247
**Problem:** Default address "Podstrana, Put Svetog Martina 12", WiFi "VillaMarija-5G"
**Fix:** Make fields editable, remove defaults

### 11. LandingPage destination hardcoded suggestions
**File:** LandingPage.jsx L56
**Problem:** `Split & Podstrana` listed as first destination
**Fix:** Fine — these are marketing examples, not functional

### 12. Chat system prompt references Podstrana
**File:** App.jsx L1229
**Problem:** `SMJEŠTAJ: ${G.accommodation}. Domaćin: ${G.host}`
**Fix:** Dynamic — already reads from G object, but G defaults to Podstrana

## LOW — Nice to have

### 13. Booking.com "Browse" button hardcoded to Split
**File:** App.jsx L1947 (KioskHome)
**Fix:** Use kioskCity for Booking.com search

### 14. Viator search not location-aware
**File:** App.jsx L879-900
**Fix:** Pass kioskCoords to Viator search

### 15. LOYALTY system uses hardcoded values
**File:** App.jsx L1210-1215
**Fix:** Real loyalty tracking via Firestore
