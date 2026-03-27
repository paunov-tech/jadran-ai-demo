# JADRAN.AI — Project Charter
**Version:** 1.0 | **Date:** 2026-03-27 | **Owner:** Miroslav Paunov / SIAL Consulting d.o.o.

---

## 1. Vision Statement

Jadran.ai je AI turistički operater koji prati gosta od prvog klika do povratka kući — i prodaje sve što se dogodi između.

---

## 2. Stakeholder Matrix (RACI)

| Stakeholder | Uloga | R | A | C | I |
|---|---|:---:|:---:|:---:|:---:|
| **Miroslav Paunov** | Product Owner / Tech Lead | ✅ | ✅ | | |
| **Srđan** | Field Sales / Partner Onboarding (Rab) | ✅ | | ✅ | |
| **Black Jack Rab** (booking@blackjackrab.com) | Pilot Partner — Direct Accommodation | | | ✅ | ✅ |
| **Budući smeštajni partneri** | Accommodation partners (ugovor o reklamiranju) | | | ✅ | ✅ |
| **Turisti / krajnji korisnici** | End users | | | | ✅ |
| **GetYourGuide / Viator / Booking.com** | Affiliate revenue partners | | | | ✅ |

**Legenda:** R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 3. Platform Architecture — Single Funnel, Three Entry Points

```
┌──────────────────────────────────────────────────────┐
│                   JADRAN.AI FUNNEL                    │
├──────────────┬──────────────────┬────────────────────┤
│  Entry A     │    Entry B       │    Entry C         │
│  LandingPage │  DestinationExp. │  QR kod (soba)     │
│  (transport  │  (operator flow, │  (GuestOnboarding) │
│   tiles)     │   JAD-ID)        │                    │
└──────┬───────┴────────┬─────────┴────────┬───────────┘
       └────────────────┴──────────────────┘
                        │
                 DELTA_CONTEXT (localStorage)
                 { segment, transport, from,
                   destination, arrival_date,
                   departure_date, travelers,
                   booking_id, phase }
                        │
       ┌────────────────┼──────────────────┐
       ↓                ↓                  ↓
  PRE-TRIP          TRANSIT            ODMOR/STAY
  (priprema)        (GPS + HERE        (kiosk, GYG,
  GYG bundles       routing, border    Viator, Gems,
  Booking.com       intelligence)      AI Pulse)
  affiliate                                │
                                       POVRATAK
                                       (departure
                                        checklist,
                                        Booking rebook,
                                        loyalty)
```

---

## 4. Poslovni model — Revenue per Guest

| Stream | Iznos | Trigger |
|---|---|---|
| Premium (7-day) | €9.99 | Aktivacija AI chat |
| Premium (Season) | €19.99 | Full AI companion |
| Premium (VIP) | €49.99 | Priority + exclusive |
| Booking.com affiliate | ~8-15% komisija | Klik → booking |
| GetYourGuide affiliate | ~8% komisija | Klik → booking |
| Viator affiliate | ~8% komisija | Klik → booking |
| Direct partner fee | Dogovor | Black Jack + budući |
| **Cilj per guest** | **~20-30€** | |

---

## 5. Milestone Plan (2026)

| Sprint | Status | Opis |
|---|---|---|
| S1–S5 | ✅ DONE | Core platform, GPS, YOLO, Stripe, email |
| S6 | ✅ DONE | DELTA_CONTEXT, segmenti, transit, operator flow (CC) |
| **S7A** | ✅ DONE | Dehardcode Podstrana, region helper, Rab gems/exp |
| **S7B** | ✅ DONE | Datumi u onboardingu (lifecycle hook) |
| **S7C** | ✅ DONE | Unifikacija 3 putanje → isti DELTA |
| **S8** | 🔜 NEXT | Gmail→Drive integracija, n8n agent R01 |
| **S9** | 📅 Q2 | Drugi direktni partner (Istria ili Zadar) |
| **S10** | 📅 Q3 | Monetizacija scale — 10+ partnera, SEO landing pages |

---

## 6. Onboarding Flow (Sprint 7B rezultat)

```
LandingPage → Korisnik bira transport (kamper/auto/avion/odmor)
                       ↓
             Odakle krećeš? (HERE autosuggest)
                       ↓
             Kuda ideš? (HERE autosuggest)
                       ↓
         [NOVO] Dolazak ──── Povratak (date inputs)
                       ↓
             → saveDelta({ arrival_date, departure_date })
             → URL params: ?arr=YYYY-MM-DD&dep=YYYY-MM-DD
                       ↓
             App.jsx → reads params → DELTA complete
             → AI Pulse ima vremenski okvir
             → PostStay prikazuje dinamičan broj noći
             → Loyalty bodovi kalkulirani po boravku
```

---

## 7. Risk Register

| Risk | Vjerovatnoća | Impact | Mitigacija |
|---|---|---|---|
| Partner (Black Jack) ne onboarda goste aktivno | Srednja | Visok | Srđan field onboarding + tablet setup |
| Viator/GYG ne vraća rezultate za Rab | Visoka | Srednji | Region-filtered EXPERIENCES fallback ✅ |
| Podstrana hardcode u produkciji | ✅ Riješeno | — | Sprint 7A |
| Datumi se ne pamte kroz sesije | ✅ Riješeno | — | Sprint 7B |
| Korisnik gubi DELTA na clear cache | Srednja | Nizak | Firestore backup za premium |
| Licenca turističkog operatera (EU) | Niska | Visok | Legal review Q3 ako revenue raste |

---

## 8. Definition of Done — Partner Onboarding

Partner je "live" kada:
- [ ] Dodat u `DIRECT_PARTNERS` array (DestinationExplorer.jsx)
- [ ] Email notifikacija radi (Resend → partner email + turist)
- [ ] JAD-booking-ID generiran i u Firestoru
- [ ] `?kiosk=DESTINACIJA` URL radi za tablet demo
- [ ] Gems za destinaciju dodane (min 3)
- [ ] Experiences za destinaciju dodane (min 3 GYG linkovi)

---

## 9. Contacts

| Osoba | Email | Uloga |
|---|---|---|
| Miroslav Paunov | info@sialconsulting.com | Product Owner |
| Srđan | — | Field Sales, Rab |
| Black Jack Rab | booking@blackjackrab.com | Pilot Partner |
| Admin panel | jadran.ai/ai?admin=sial | — |
| Host panel | jadran.ai/host (PIN: jadran2026) | — |
