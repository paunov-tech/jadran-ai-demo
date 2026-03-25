# JADRAN.AI — Sprint Plan 25. mart 2026
## Funkcionalni minimum pre terena

---

## VEČERAS (autonomno, bez Miroslava)

### A. LandingPage fix — hardkodovani Podstrana coords
- DEST_LAT/DEST_LNG hardkodirano na Podstranu
- Mini-mapa na landing page-u uvek pokazuje rutu ka Podstrani
- FIX: koristiti coords iz destinacije koju korisnik izabere

### B. HostPanel cleanup
- Placeholder "Podstrana, Put Svetog Martina 12", "VillaMarija-5G"
- FIX: isprazniti defaultove

### C. HANDOFF.md za sutra — detaljan kontekst za nastavak

---

## SUTRA — 4 sprinta

### SPRINT 1: Stripe payment flow (1.5h) — CRITICAL
**Problem:** Premium se otključava samo ručno iz localStorage.
Stripe redirect flow (checkout → plaćanje → redirect → verify) 
nije testiran end-to-end. Moguće da:
- returnPath greši (jadran.ai/ umesto jadran.ai/?room=DEMO)
- verify.js ne šalje deviceId
- webhook.js ne piše u Firebase pravilno
- App.jsx ne čita payment=success iz URL-a na kiosk modu

**Tasks:**
1. Testirati Stripe test mode checkout → redirect → verify
2. Proveriti da webhook piše u jadran_premium collection
3. Proveriti da App.jsx čita premium iz Firebase na mount
4. Dodati deviceId u checkout flow (App.jsx koristi roomCode, ne deviceId)
5. End-to-end test: plaćanje → refresh → premium ostaje

### SPRINT 2: Chat stabilnost (1h) 
**Problem:** Chat (AI Guide) puca kad se otvori iz kioska.
**Tasks:**
1. Proveriti KioskChat hook count vs KioskHome
2. Testirati chat sa pitanjima na HR/DE/EN
3. Proveriti rate limiting (chat.js ima 3-layer, ali frontend?)
4. Fallback kad API key nije konfigurisan

### SPRINT 3: Visual polish (1h)
**Tasks:**
1. Kiosk tiles — ista ikona za Hrana/Dućan/Pekara (sva tri ψα). 
   Treba razlicite ikone.
2. PRO badge na Gems/Chat ali NE na premium test users
3. Welcome screen — testirati na Jadranu (ne Zrenjaninu)
4. Page-enter animacija na pre/post ali ne na kiosk subscreen swap

### SPRINT 4: Affiliate & Activities (1h)
**Problem:** Aktivnosti prikazuju Split fallback svuda.
**Tasks:**
1. Viator search po destinaciji (već fixovano u kodu, treba testirati)
2. Gems — prikazati samo za Split region, sakriti za ostale
3. Booking.com link dinamičan (fixovano, testirati)
4. GYG/Viator affiliate linkovi — proveriti da rade

---

## NE RADITI SUTRA (backlog)
- TZ Dashboard (shell, nema korisnika)
- Firebase guest profiles (kompleksno, nije blocker)
- Push notifications (konfigurisane, ne testirati sad)
- YOLO crowd integration u kiosk (nice-to-have)
- EU application (dokumenti gotovi)
- Custom domain setup
