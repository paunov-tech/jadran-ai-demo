// src/poiDatabase.js — JADRAN.AI Point of Interest Database
// Static POIs along AT→SLO→HR corridor, tagged by segment relevance
// GPS engine checks proximity and fires segment-specific cards

import { distKm } from "./geofences";

// POI types: lpg, dump_station, marina, viewpoint, rest_stop, mcdonalds, camp, beach_family, wine, tunnel_warning
export const POIS = [
  // ═══ LPG STATIONS (kamper critical) ═══
  { id: "lpg_villach", lat: 46.611, lng: 13.849, type: "lpg", name: "OMV Villach A2", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: OMV Villach (A2 izlaz). Zadnja jeftina LPG prije SLO!", de: "LPG: OMV Villach (A2 Ausfahrt). Letztes günstiges LPG vor SLO!" } },
  { id: "lpg_ljubljana", lat: 46.065, lng: 14.543, type: "lpg", name: "Petrol LPG Ljubljana", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: Petrol Ljubljana (BTC). Punjenje prije HR autoceste.", de: "LPG: Petrol Ljubljana (BTC). Tanken vor HR-Autobahn." } },
  { id: "lpg_zagreb_w", lat: 45.793, lng: 15.830, type: "lpg", name: "INA LPG Zagreb zapad", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: INA Zagreb zapad (Jankomir). Zadnja LPG prije A1 na jug!", de: "LPG: INA Zagreb West (Jankomir). Letztes LPG vor A1 Richtung Süden!" } },
  { id: "lpg_karlovac", lat: 45.487, lng: 15.555, type: "lpg", name: "INA LPG Karlovac", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: INA Karlovac. Sljedećih 200km nema LPG do Zadra!", de: "LPG: INA Karlovac. Nächste 200km kein LPG bis Zadar!" } },
  { id: "lpg_zadar", lat: 44.120, lng: 15.254, type: "lpg", name: "INA LPG Zadar", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: INA Zadar. Sljedeća LPG tek Split (120km)!", de: "LPG: INA Zadar. Nächstes LPG erst Split (120km)!" } },
  { id: "lpg_split", lat: 43.531, lng: 16.486, type: "lpg", name: "INA LPG Split", segments: ["kamper"], radius: 3,
    card: { hr: "LPG: INA Split (Duje). Zadnja LPG prije Dubrovnika!", de: "LPG: INA Split (Duje). Letztes LPG vor Dubrovnik!" } },

  // ═══ DUMP STATIONS / ENTSORGUNG (kamper critical) ═══
  { id: "dump_villach", lat: 46.598, lng: 13.832, type: "dump_station", name: "Dump Villach Camping", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: Camping Villach. Besplatno za goste, 5€ ostali.", de: "Entsorgung: Camping Villach. Gratis für Gäste, 5€ andere." } },
  { id: "dump_krk", lat: 45.071, lng: 14.565, type: "dump_station", name: "Dump Krk Camping", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: Kamp Ježevac, Krk. Besplatna za kampere.", de: "Entsorgung: Camp Ježevac, Krk. Gratis für Camper." } },
  { id: "dump_split_s", lat: 43.479, lng: 16.499, type: "dump_station", name: "Dump Stobreč", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: AutoCamp Stobreč. 5km od Splita, bus 60.", de: "Entsorgung: AutoCamp Stobreč. 5km von Split, Bus 60." } },
  { id: "dump_dubrovnik", lat: 42.668, lng: 18.064, type: "dump_station", name: "Dump Solitudo", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: Kamp Solitudo (Babin Kuk). Jedini dump blizu Dubrovnika.", de: "Entsorgung: Camp Solitudo (Babin Kuk). Einzige nahe Dubrovnik." } },
  { id: "dump_zadar", lat: 44.135, lng: 15.200, type: "dump_station", name: "Dump Borik Zadar", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: Kamp Borik, Zadar. Blizu centra.", de: "Entsorgung: Camp Borik, Zadar. Stadtnah." } },
  { id: "dump_rovinj", lat: 45.078, lng: 13.651, type: "dump_station", name: "Dump Veštar Rovinj", segments: ["kamper"], radius: 2,
    card: { hr: "Dump stanica: Kamp Veštar, Rovinj.", de: "Entsorgung: Camp Veštar, Rovinj." } },

  // ═══ TUNNEL WARNINGS (kamper critical — heights) ═══
  { id: "tun_karavanke", lat: 46.443, lng: 14.081, type: "tunnel_warning", name: "Karavanke tunel 4.1m", segments: ["kamper"], radius: 8,
    card: { hr: "⚠️ Karavanke tunel: visina 4.1m! Provjerite visinu svog kampera + antena!", de: "⚠️ Karawankentunnel: Höhe 4.1m! Camper-Dachhöhe + Antenne prüfen!" } },
  { id: "tun_ucka", lat: 45.308, lng: 14.172, type: "tunnel_warning", name: "Učka tunel 4.5m", segments: ["kamper"], radius: 6,
    card: { hr: "Tunel Učka: visina 4.5m, dužina 5062m. Upali svjetla! Većina kampera prolazi.", de: "Učka-Tunnel: Höhe 4.5m, Länge 5062m. Licht an! Die meisten Camper passen." } },
  { id: "tun_svrok", lat: 44.310, lng: 15.436, type: "tunnel_warning", name: "Tunel Sv. Rok 4.2m", segments: ["kamper"], radius: 6,
    card: { hr: "Tunel Sv. Rok (A1): visina 4.2m, dužina 5679m. Nema signala unutra!", de: "Tunnel Sv. Rok (A1): Höhe 4.2m, Länge 5679m. Kein Signal im Tunnel!" } },
  { id: "tun_mala_kapela", lat: 44.905, lng: 15.088, type: "tunnel_warning", name: "Tunel Mala Kapela 4.2m", segments: ["kamper"], radius: 6,
    card: { hr: "Tunel Mala Kapela (A1): visina 4.2m, dužina 5780m. Najduži tunel na A1!", de: "Tunnel Mala Kapela (A1): Höhe 4.2m, Länge 5780m. Längster Tunnel auf A1!" } },

  // ═══ MARINAS (jedrilicar) ═══
  { id: "marina_split", lat: 43.504, lng: 16.435, type: "marina", name: "ACI Marina Split", segments: ["jedrilicar"], radius: 3,
    card: { hr: "ACI Marina Split. VHF Ch 17. 355 vezova. Fuel dock: da. Gaz do 5m.", de: "ACI Marina Split. VHF Ch 17. 355 Liegeplätze. Tankstelle: ja. Tiefgang bis 5m." } },
  { id: "marina_dubrovnik", lat: 42.659, lng: 18.083, type: "marina", name: "ACI Marina Dubrovnik", segments: ["jedrilicar"], radius: 3,
    card: { hr: "ACI Marina Dubrovnik. VHF Ch 17. 380 vezova. Taxi čamci do Starog grada.", de: "ACI Marina Dubrovnik. VHF Ch 17. 380 Plätze. Wassertaxi zur Altstadt." } },
  { id: "marina_trogir", lat: 43.517, lng: 16.251, type: "marina", name: "ACI Marina Trogir", segments: ["jedrilicar"], radius: 3,
    card: { hr: "ACI Marina Trogir. VHF Ch 17. 174 veza. Charter baza — provjeri vjetar Splitska vrata!", de: "ACI Marina Trogir. VHF Ch 17. 174 Plätze. Charterbasis — Wind Splitska vrata prüfen!" } },
  { id: "marina_zadar", lat: 44.110, lng: 15.222, type: "marina", name: "Marina Zadar (Tankerkomerc)", segments: ["jedrilicar"], radius: 3,
    card: { hr: "Marina Zadar. VHF Ch 17. 300 vezova. Blizu Morskih orgulja i Pozdrava suncu.", de: "Marina Zadar. VHF Ch 17. 300 Plätze. Nahe Meeresorgel und Sonnengruß." } },
  { id: "marina_pula", lat: 44.866, lng: 13.844, type: "marina", name: "ACI Marina Pula", segments: ["jedrilicar"], radius: 3,
    card: { hr: "ACI Marina Pula. VHF Ch 17. 192 veza. Arena na 5 min hoda!", de: "ACI Marina Pula. VHF Ch 17. 192 Plätze. Arena 5 Min. zu Fuß!" } },
  { id: "marina_korcula", lat: 42.960, lng: 17.136, type: "marina", name: "ACI Marina Korčula", segments: ["jedrilicar"], radius: 3,
    card: { hr: "ACI Marina Korčula. VHF Ch 17. 159 vezova. Marco Polo kuća 2 min!", de: "ACI Marina Korčula. VHF Ch 17. 159 Plätze. Marco-Polo-Haus 2 Min!" } },
  { id: "marina_hvar", lat: 43.172, lng: 16.441, type: "marina", name: "ACI Marina Palmižana", segments: ["jedrilicar"], radius: 4,
    card: { hr: "ACI Palmižana (Hvar). VHF Ch 17. Sidrište + restoran. Maestral poslijepodne!", de: "ACI Palmižana (Hvar). VHF Ch 17. Ankerplatz + Restaurant. Maestral nachmittags!" } },

  // ═══ VIEWPOINTS (par — romantic stops) ═══
  { id: "vp_bled", lat: 46.369, lng: 14.110, type: "viewpoint", name: "Bled — jezero (15 min skretanje)", segments: ["par"], radius: 10,
    card: { hr: "💑 Bled jezero — 15 min skretanje sa A2. Romantični pogled, kremšnita!", de: "💑 Bleder See — 15 Min Abstecher von A2. Romantischer Blick, Cremeschnitte!" } },
  { id: "vp_plitvice", lat: 44.880, lng: 15.616, type: "viewpoint", name: "Plitvice — vidikovac (A1 izlaz)", segments: ["par", "porodica"], radius: 8,
    card: { hr: "Plitvička jezera — izlaz sa A1. UNESCO! 2-3h za gornja jezera.", de: "Plitvicer Seen — A1 Ausfahrt. UNESCO! 2-3h für die oberen Seen." } },
  { id: "vp_peljesac_wine", lat: 42.926, lng: 17.184, type: "viewpoint", name: "Pelješac — vinska cesta", segments: ["par"], radius: 8,
    card: { hr: "💑 Pelješac vinska cesta — Dingač, Postup, Mali Ston. Degustacija + ostrige!", de: "💑 Pelješac Weinstraße — Dingač, Postup, Mali Ston. Weinprobe + Austern!" } },
  { id: "vp_skywalk_biokovo", lat: 43.331, lng: 17.046, type: "viewpoint", name: "Biokovo Skywalk", segments: ["par"], radius: 8,
    card: { hr: "💑 Biokovo Skywalk — staklena platforma 1228m. Pogled na Brač i Hvar!", de: "💑 Biokovo Skywalk — Glasplattform 1228m. Blick auf Brač und Hvar!" } },
  { id: "vp_motovun", lat: 45.336, lng: 13.831, type: "viewpoint", name: "Motovun — istarski hilltop", segments: ["par"], radius: 6,
    card: { hr: "💑 Motovun — middleagesni grad na brdu. Tartufi, vino, pogled na Mirnu!", de: "💑 Motovun — mittelalterliche Hügelstadt. Trüffel, Wein, Blick auf Mirna!" } },
  { id: "vp_starigrad_paklenica", lat: 44.301, lng: 15.452, type: "viewpoint", name: "Paklenica — kanjon", segments: ["par", "porodica"], radius: 6,
    card: { hr: "NP Paklenica — izlaz Starigrad. Kanjon + penjanje. 1h šetnja do Anića kuka.", de: "NP Paklenica — Ausfahrt Starigrad. Schlucht + Klettern. 1h Wanderung zum Anića kuk." } },

  // ═══ REST STOPS + McDonald's (porodica — WC + hrana) ═══
  { id: "mc_graz", lat: 47.042, lng: 15.463, type: "mcdonalds", name: "McDonald's Graz Süd (A2)", segments: ["porodica"], radius: 3,
    card: { hr: "🍔 McDonald's Graz Süd — WC, igralište, Happy Meal. Zadnji prije SLO!", de: "🍔 McDonald's Graz Süd — WC, Spielplatz, Happy Meal. Letzter vor SLO!" } },
  { id: "mc_lj", lat: 46.058, lng: 14.540, type: "mcdonalds", name: "McDonald's Ljubljana BTC", segments: ["porodica"], radius: 3,
    card: { hr: "🍔 McDonald's Ljubljana BTC — WC, igralište, punjač. Blizu A1/A2.", de: "🍔 McDonald's Ljubljana BTC — WC, Spielplatz, Ladestation. Nahe A1/A2." } },
  { id: "mc_zagreb", lat: 45.789, lng: 15.900, type: "mcdonalds", name: "McDonald's Zagreb A3", segments: ["porodica"], radius: 3,
    card: { hr: "🍔 McDonald's Zagreb (Jankomir) — WC, Happy Meal. Uz A3/A1.", de: "🍔 McDonald's Zagreb (Jankomir) — WC, Happy Meal. An A3/A1." } },
  { id: "rest_otocac", lat: 44.869, lng: 15.243, type: "rest_stop", name: "Odmorište Otočac (A1)", segments: ["porodica", "kamper"], radius: 3,
    card: { hr: "Odmorište Otočac (A1) — WC, kava, benzin. Djeca: pauza prije Gorskog Kotara!", de: "Raststätte Otočac (A1) — WC, Kaffee, Tanken. Kinder: Pause vor Gorski Kotar!" } },
  { id: "rest_brinje", lat: 44.997, lng: 15.128, type: "rest_stop", name: "Odmorište Brinje (A1)", segments: ["porodica", "kamper"], radius: 3,
    card: { hr: "Odmorište Brinje (A1) — WC, snack. Zadnje odmorište prije tunela Mala Kapela!", de: "Raststätte Brinje (A1) — WC, Snack. Letzte Rast vor Tunnel Mala Kapela!" } },
  { id: "rest_jasenice", lat: 44.209, lng: 15.534, type: "rest_stop", name: "PUO Jasenice (A1)", segments: ["porodica", "kamper"], radius: 3,
    card: { hr: "PUO Jasenice (A1) — pogled na Velebit! WC, benzin, snack bar.", de: "Raststätte Jasenice (A1) — Velebit-Blick! WC, Tanken, Snackbar." } },
  { id: "mc_split_mall", lat: 43.533, lng: 16.470, type: "mcdonalds", name: "McDonald's Mall of Split", segments: ["porodica"], radius: 3,
    card: { hr: "🍔 McDonald's Mall of Split — WC, klima, igralište. Parking besplatan 3h!", de: "🍔 McDonald's Mall of Split — WC, Klima, Spielplatz. 3h gratis Parken!" } },

  // ═══ FAMILY BEACHES (porodica) ═══
  { id: "beach_nin", lat: 44.242, lng: 15.179, type: "beach_family", name: "Nin Kraljičina plaža", segments: ["porodica"], radius: 5,
    card: { hr: "👨‍👩‍👧 Kraljičina plaža Nin — plitko, pijesak, ljekovito blato! Idealno za djecu.", de: "👨‍👩‍👧 Königin-Strand Nin — flach, Sand, Heilschlamm! Ideal für Kinder." } },
  { id: "beach_lopar", lat: 44.839, lng: 14.729, type: "beach_family", name: "Lopar Rajska plaža (Rab)", segments: ["porodica"], radius: 4,
    card: { hr: "👨‍👩‍👧 Rajska plaža, Lopar (Rab) — 1.5km pijeska, plitko more. Raj za djecu!", de: "👨‍👩‍👧 Paradiesstrand, Lopar (Rab) — 1.5km Sand, flaches Meer. Kinderparadies!" } },
  { id: "beach_sakarun", lat: 44.136, lng: 14.862, type: "beach_family", name: "Sakarun (Dugi Otok)", segments: ["porodica", "par"], radius: 4,
    card: { hr: "Sakarun plaža (Dugi Otok) — bijeli pijesak, tirkizno more. Trajekt iz Zadra.", de: "Sakarun Strand (Dugi Otok) — weißer Sand, türkises Meer. Fähre ab Zadar." } },

  // ═══ CAMPING SPOTS (kamper) ═══
  { id: "camp_krk", lat: 45.071, lng: 14.565, type: "camp", name: "Kamp Ježevac, Krk", segments: ["kamper"], radius: 3,
    card: { hr: "⛺ Kamp Ježevac (Krk grad) — 5*, plaža, bazen, dump stanica. Rezervacija ljeti!", de: "⛺ Camp Ježevac (Krk Stadt) — 5*, Strand, Pool, Entsorgung. Reservierung im Sommer!" } },
  { id: "camp_stobrec", lat: 43.479, lng: 16.499, type: "camp", name: "AutoCamp Stobreč", segments: ["kamper"], radius: 3,
    card: { hr: "⛺ AutoCamp Stobreč — 5km od Splita, bus 60 do centra. Dump + struja.", de: "⛺ AutoCamp Stobreč — 5km von Split, Bus 60 zum Zentrum. Entsorgung + Strom." } },
  { id: "camp_solitudo", lat: 42.668, lng: 18.064, type: "camp", name: "Kamp Solitudo, Dubrovnik", segments: ["kamper"], radius: 3,
    card: { hr: "⛺ Kamp Solitudo (Babin Kuk) — jedini kamp blizu Dubrovnika! Bus 6 do zidina.", de: "⛺ Camp Solitudo (Babin Kuk) — einziger Campingplatz nahe Dubrovnik! Bus 6 zur Altstadt." } },
];

// ═══ RAB ISLAND POI DATABASE ═══
export const RAB_POIS = {
  beaches: [
    { id: 'rajska-plaza', name: 'Paradise Beach (Rajska Plaža)', name_de: 'Paradiesstrand (Rajska Plaža)', lat: 44.8305, lng: 14.7195, geofence: 'lopar', type: 'beach', subtype: 'sandy', rating: 4.7, family_friendly: true,
      description_en: 'Croatia\'s most famous sandy beach — 2km long, shallow crystal-clear water, perfect for families. Water sports, beach bars, lifeguard. Arrive before 10am in summer.',
      description_de: 'Kroatiens berühmtester Sandstrand — 2km lang, flaches kristallklares Wasser, perfekt für Familien. Wassersport, Strandbars, Rettungsschwimmer. Im Sommer vor 10 Uhr ankommen.',
      amenities: ['sunloungers','umbrellas','showers','changing_rooms','restaurant','bar','watersports','lifeguard','volleyball','minigolf','waterslide'] },
    { id: 'banova-vila', name: 'Banova Vila Beach', name_de: 'Banova Vila Strand', lat: 44.7545, lng: 14.7610, geofence: 'rab-town', type: 'beach', subtype: 'pebble_rocky', rating: 4.5, family_friendly: true,
      description_en: 'Rab Town\'s most popular beach, right below the old town walls. Water polo, kayaks, beach bar with live music at sunset.',
      description_de: 'Beliebtester Strand der Stadt Rab, direkt unterhalb der Altstadtmauern. Wasserball, Kajaks, Strandbar mit Livemusik bei Sonnenuntergang.',
      amenities: ['sunloungers','bar','kayak_rental','water_polo','pedal_boats'] },
    { id: 'pudarica', name: 'Pudarica Beach', name_de: 'Pudarica Strand', lat: 44.7320, lng: 14.7890, geofence: 'barbat', type: 'beach', subtype: 'sandy', rating: 4.4, family_friendly: true,
      description_en: 'Family beach by day, party beach by night. Sandy with clear water, beach bar transforms into nightclub after dark.',
      description_de: 'Familienstrand tagsüber, Partystrand nachts. Sandig mit klarem Wasser, Strandbar wird nach Einbruch der Dunkelheit zum Nachtclub.',
      amenities: ['sunloungers','bar','nightclub','restaurant','watersports'] },
    { id: 'suha-punta', name: 'Suha Punta Beach', name_de: 'Suha Punta Strand', lat: 44.7720, lng: 14.7050, geofence: 'kampor', type: 'beach', subtype: 'pebble_rocky', rating: 4.6, family_friendly: false,
      description_en: 'Peaceful pebble beaches on Kalifront peninsula, surrounded by pine forest. Natural shade, cocktail bars, tennis court. Access by taxi boat, bike, or car.',
      description_de: 'Friedliche Kiesstrände auf der Kalifront-Halbinsel, umgeben von Kiefernwald. Natürlicher Schatten, Cocktailbars, Tennisplatz. Zugang per Taxiboot, Fahrrad oder Auto.',
      amenities: ['bar','tennis','volleyball','natural_shade'] },
    { id: 'sahara-beach', name: 'Sahara Beach', name_de: 'Sahara Strand', lat: 44.8350, lng: 14.7150, geofence: 'lopar', type: 'beach', subtype: 'sandy', rating: 4.3, family_friendly: false,
      description_en: 'Secluded naturist-friendly sandy beach. Less crowded than Paradise Beach. Beautiful sandstone formations. Bring your own supplies.',
      description_de: 'Abgelegener FKK-freundlicher Sandstrand. Weniger überfüllt als Paradise Beach. Schöne Sandsteinformationen. Eigene Verpflegung mitbringen.',
      amenities: [] },
    { id: 'livacina', name: 'Livačina Beach', name_de: 'Livačina Strand', lat: 44.8280, lng: 14.7230, geofence: 'lopar', type: 'beach', subtype: 'sandy', rating: 4.5, family_friendly: true,
      description_en: 'Sandy family beach near Paradise Beach with natural tree shade. Clear emerald water, watersports, restaurants nearby.',
      description_de: 'Sandiger Familienstrand nahe Paradise Beach mit natürlichem Baumschatten. Klares smaragdgrünes Wasser, Wassersport, Restaurants in der Nähe.',
      amenities: ['sunloungers','watersports','volleyball','restaurant','natural_shade'] },
    { id: 'ciganka', name: 'Ciganka Beach', name_de: 'Ciganka Strand', lat: 44.8200, lng: 14.7300, geofence: 'lopar', type: 'beach', subtype: 'sandy', rating: 4.2, family_friendly: true,
      description_en: 'Quieter sandy beach south of Paradise Beach. Less touristy, good snorkeling on the edges.',
      description_de: 'Ruhigerer Sandstrand südlich des Paradise Beach. Weniger touristisch, gutes Schnorcheln an den Rändern.' },
  ],
  attractions: [
    { id: 'rab-old-town', name: 'Rab Old Town (Four Bell Towers)', name_de: 'Altstadt Rab (Vier Glockentürme)', lat: 44.7565, lng: 14.7625, geofence: 'rab-town', type: 'attraction', subtype: 'historic', rating: 4.8,
      description_en: 'Medieval walled town with four bell towers creating a ship silhouette. Narrow streets, Venetian-Roman architecture, Rector\'s Palace, boutiques and cafés.',
      description_de: 'Mittelalterliche ummauerte Stadt mit vier Glockentürmen. Enge Gassen, venezianisch-römische Architektur, Rektorenpalast, Boutiquen und Cafés.' },
    { id: 'st-mary-cathedral', name: 'Cathedral of St Mary the Great', name_de: 'Kathedrale der Hl. Maria', lat: 44.7572, lng: 14.7608, geofence: 'rab-town', type: 'attraction', subtype: 'church', rating: 4.7,
      description_en: 'Romanesque cathedral consecrated by Pope Alexander III in 1177. Climb the 26m bell tower for breathtaking Adriatic views.',
      description_de: 'Romanische Kathedrale, 1177 von Papst Alexander III. geweiht. Besteigen Sie den 26m Glockenturm für atemberaubende Adria-Ausblicke.' },
    { id: 'kamenjak', name: 'Kamenjak Viewpoint (407m)', name_de: 'Kamenjak Aussichtspunkt (407m)', lat: 44.7650, lng: 14.7450, geofence: 'mundanije', type: 'attraction', subtype: 'viewpoint', rating: 4.9,
      description_en: 'Highest point on Rab — spectacular panorama of Kvarner Bay. Drive or hike up. Restaurant at the top with amazing views.',
      description_de: 'Höchster Punkt auf Rab — spektakuläres Panorama der Kvarner Bucht. Mit dem Auto oder zu Fuß erreichbar. Restaurant oben mit fantastischer Aussicht.' },
    { id: 'geopark-rab', name: 'Geopark Rab', name_de: 'Geopark Rab', lat: 44.8300, lng: 14.7200, geofence: 'lopar', type: 'attraction', subtype: 'nature', rating: 4.6,
      description_en: 'UNESCO-declared geopark with unique sandstone formations, hiking trails along the coast, and stunning geological features.',
      description_de: 'UNESCO-deklarierter Geopark mit einzigartigen Sandsteinformationen, Küstenwanderwegen und beeindruckenden geologischen Formationen.' },
    { id: 'st-euphemia-monastery', name: 'Franciscan Monastery of St. Euphemia', name_de: 'Franziskanerkloster St. Euphemia', lat: 44.7700, lng: 14.7100, geofence: 'kampor', type: 'attraction', subtype: 'historic', rating: 4.5,
      description_en: 'Built in 1458 in a romantic bay. Beautiful painted ceiling with 27 scenes of St Francis of Assisi. Peaceful gardens.',
      description_de: 'Erbaut 1458 in einer romantischen Bucht. Wunderschön bemalte Decke mit 27 Szenen des Hl. Franziskus von Assisi. Friedliche Gärten.' },
    { id: 'komrcar-park', name: 'Komrčar Forest Park', name_de: 'Waldpark Komrčar', lat: 44.7580, lng: 14.7580, geofence: 'rab-town', type: 'attraction', subtype: 'park', rating: 4.4,
      description_en: '8-hectare green oasis near old town. Scenic walking trails, pine and cypress trees, stunning sea views.',
      description_de: '8 Hektar große grüne Oase nahe der Altstadt. Malerische Wanderwege, Kiefern und Zypressen, atemberaubende Meerblicke.' },
    { id: 'goli-otok', name: 'Goli Otok (Croatian Alcatraz)', name_de: 'Goli Otok (Kroatisches Alcatraz)', lat: 44.8400, lng: 14.8300, geofence: 'lopar', type: 'attraction', subtype: 'historic', rating: 4.3,
      description_en: 'Abandoned political prison island — haunting history from 1949-1989. Boat tours from Rab. Fascinating but sobering experience.',
      description_de: 'Verlassene politische Gefängnisinsel — eindringliche Geschichte von 1949-1989. Bootstouren ab Rab. Faszinierende aber nachdenkliche Erfahrung.' },
    { id: 'rab-cake-house', name: 'House of Rab Cake', name_de: 'Haus des Rab-Kuchens', lat: 44.7568, lng: 14.7620, geofence: 'rab-town', type: 'attraction', subtype: 'culinary', rating: 4.8,
      description_en: 'Traditional Rabska Torta — spiral-shaped almond cake, centuries-old recipe. A must-taste Rab specialty!',
      description_de: 'Traditionelle Rabska Torta — spiralförmiger Mandelkuchen, jahrhundertealtes Rezept. Ein Muss auf Rab!' },
  ],
  transport: [
    { id: 'misnjak-port', name: 'Mišnjak Ferry Port', name_de: 'Fährhafen Mišnjak', lat: 44.7150, lng: 14.8100, type: 'transport', subtype: 'ferry',
      description_en: 'Main ferry — Stinica to Mišnjak (Rapska Plovidba). ~15 min, runs hourly. ~€25 for car+passengers. Can\'t book in advance, buy at dock. Arrive early in peak season.',
      description_de: 'Hauptfähre — Stinica nach Mišnjak (Rapska Plovidba). ~15 Min., stündlich. ~€25 für Auto+Passagiere. Keine Vorabbuchung, Kauf am Dock. In der Hochsaison früh kommen.' },
    { id: 'lopar-valbiska-ferry', name: 'Lopar — Valbiska (Krk) Ferry', name_de: 'Fähre Lopar — Valbiska (Krk)', lat: 44.8350, lng: 14.7200, type: 'transport', subtype: 'ferry',
      description_en: 'Car ferry Lopar to Valbiska on Krk island (Krk is connected to mainland by bridge). Good route to northern Croatia/Rijeka.',
      description_de: 'Autofähre Lopar nach Valbiska auf der Insel Krk (Krk ist über eine Brücke mit dem Festland verbunden). Gute Route nach Nordkroatien/Rijeka.' },
    { id: 'rab-harbor', name: 'Rab Town Harbor & ACI Marina', name_de: 'Hafen & ACI Marina Rab', lat: 44.7555, lng: 14.7655, type: 'transport', subtype: 'marina',
      description_en: 'Main harbor with catamaran to Rijeka (~2h). ACI Marina for private boats. Taxi boats to beaches.',
      description_de: 'Haupthafen mit Katamaran nach Rijeka (~2h). ACI Marina für Privatboote. Taxiboote zu den Stränden.' },
  ],
  activities: [
    { id: 'rab-trek', name: 'Rab Trek Hiking Trail', name_de: 'Rab Trek Wanderweg', lat: 44.7600, lng: 14.7500, type: 'activity', subtype: 'hiking',
      description_en: 'Scenic hiking trail through oak forests, coastal cliffs, and panoramic viewpoints. Several difficulty levels available.',
      description_de: 'Malerischer Wanderweg durch Eichenwälder, Küstenklippen und Panorama-Aussichtspunkte. Verschiedene Schwierigkeitsgrade verfügbar.' },
    { id: 'kayaking-rab', name: 'Sea Kayaking around Rab', name_de: 'Seekajakfahren um Rab', lat: 44.7550, lng: 14.7640, type: 'activity', subtype: 'watersport',
      description_en: 'Explore hidden coves and caves by kayak. Tours depart from Rab town and Banova Vila beach. Half-day and full-day options.',
      description_de: 'Entdecken Sie versteckte Buchten und Höhlen per Kajak. Touren starten ab Rab Stadt und Banova Vila Strand. Halb- und Ganztagesoptionen.' },
    { id: 'diving-rab', name: 'Diving Center Rab', name_de: 'Tauchzentrum Rab', lat: 44.7540, lng: 14.7650, type: 'activity', subtype: 'watersport',
      description_en: 'Several dive sites around Rab — walls, caves, and wrecks. PADI courses available for beginners.',
      description_de: 'Mehrere Tauchplätze um Rab — Wände, Höhlen und Wracks. PADI-Kurse für Anfänger verfügbar.' },
    { id: 'rabska-fjera', name: 'Rabska Fjera (Medieval Festival)', name_de: 'Rabska Fjera (Mittelalterfest)', lat: 44.7565, lng: 14.7625, type: 'activity', subtype: 'festival',
      description_en: 'Annual medieval festival in July celebrating Rab\'s history. Crossbow tournament, medieval crafts, food and music. The whole town transforms!',
      description_de: 'Jährliches Mittelalterfest im Juli zur Feier der Geschichte von Rab. Armbrustturnier, mittelalterliches Handwerk, Essen und Musik. Die ganze Stadt verwandelt sich!' },
  ],
};

// ═══ RAB ISLAND LIVE CAMERAS ═══
export const RAB_CAMERAS = [
  { id: 'rab-center-municipium', name: 'Rab Center — Municipium Arba Square', name_de: 'Rab Zentrum — Municipium Arba Platz', lat: 44.7562, lng: 14.7640, geofence: 'rab-town', source: 'livecamcroatia',
    url: 'https://www.livecamcroatia.com/en/camera/rab-center-municipium-arba-square' },
  { id: 'rab-port-entrance', name: 'Rab — Port Entrance', name_de: 'Rab — Hafeneinfahrt', lat: 44.7555, lng: 14.7655, geofence: 'rab-town', source: 'livecamcroatia',
    url: 'https://www.livecamcroatia.com/en/camera/rab-municipium-arba-square-port-entrance' },
  { id: 'rab-old-town-cam', name: 'Rab Old Town & Beach', name_de: 'Rab Altstadt & Strand', lat: 44.7565, lng: 14.7625, geofence: 'rab-town', source: 'skylinewebcams',
    url: 'https://www.skylinewebcams.com/en/webcam/hrvatska/primorsko-goranska/rab/rab-island-old-town.html' },
  { id: 'rab-banjol', name: 'Banjol — Rab Island', name_de: 'Banjol — Insel Rab', lat: 44.7500, lng: 14.7750, geofence: 'rab-town', source: 'skylinewebcams',
    url: 'https://www.skylinewebcams.com/en/webcam/hrvatska/primorsko-goranska/rab/rab-island.html' },
  { id: 'rab-lopar-cam', name: 'Lopar — San Marino Beach', name_de: 'Lopar — San Marino Strand', lat: 44.8261, lng: 14.7281, geofence: 'lopar', source: 'skylinewebcams',
    url: 'https://www.skylinewebcams.com/en/webcam/hrvatska/primorsko-goranska/rab/rab-island-lopar.html' },
  { id: 'rab-paradise-beach-cam', name: 'Paradise Beach — Lopar', name_de: 'Paradiesstrand — Lopar', lat: 44.8305, lng: 14.7195, geofence: 'lopar', source: 'skylinewebcams',
    url: 'https://www.skylinewebcams.com/en/webcam/hrvatska/primorsko-goranska/rab/paradise-beach.html' },
  { id: 'rab-obala-kresimira', name: 'Rab — Obala Petra Krešimira', name_de: 'Rab — Obala Petra Krešimira', lat: 44.7558, lng: 14.7645, geofence: 'rab-town', source: 'whatsupcams',
    url: 'https://www.whatsupcams.com/en/webcams/croatia/primorje-gorski-kotar/rab/webcam-rab-obala-petra-kresimira/' },
  { id: 'rab-st-euphemia', name: 'Rab — Gulf of St. Euphemia', name_de: 'Rab — Golf von St. Euphemia', lat: 44.7700, lng: 14.7100, geofence: 'kampor', source: 'whatsupcams',
    url: 'https://www.whatsupcams.com/en/webcams/croatia/primorje-gorski-kotar/rab/rab-the-gulf-of-st-euphemia/' },
];

// Find POIs near a position, filtered by segment
export function nearbyPOIs(lat, lng, segment, radiusKm = 25) {
  return POIS
    .filter(p => p.segments.includes(segment))
    .map(p => ({ ...p, dist: distKm(lat, lng, p.lat, p.lng) }))
    .filter(p => p.dist <= radiusKm)
    .sort((a, b) => a.dist - b.dist);
}

// Find POIs along a route (check each POI against route corridor)
export function poisAlongRoute(fromLat, fromLng, toLat, toLng, segment) {
  // Simple: POIs within 30km of the straight line between from→to
  // More accurate would use actual route polyline, but this covers 90% of cases
  const results = [];
  for (const p of POIS) {
    if (!p.segments.includes(segment)) continue;
    // Point-to-line-segment distance approximation
    const distToLine = pointToSegmentDist(p.lat, p.lng, fromLat, fromLng, toLat, toLng);
    if (distToLine <= 30) { // within 30km of route line
      const distFromStart = distKm(fromLat, fromLng, p.lat, p.lng);
      results.push({ ...p, distFromRoute: distToLine, distFromStart });
    }
  }
  return results.sort((a, b) => a.distFromStart - b.distFromStart);
}

// Point to line segment distance (haversine-approximate)
function pointToSegmentDist(pLat, pLng, aLat, aLng, bLat, bLng) {
  const dAB = distKm(aLat, aLng, bLat, bLng);
  if (dAB < 0.1) return distKm(pLat, pLng, aLat, aLng);
  const dAP = distKm(aLat, aLng, pLat, pLng);
  const dBP = distKm(bLat, bLng, pLat, pLng);
  // If P is "past" either end, use distance to nearest endpoint
  if (dAP * dAP > dBP * dBP + dAB * dAB) return dBP;
  if (dBP * dBP > dAP * dAP + dAB * dAB) return dAP;
  // Heron's formula for triangle area → height = perpendicular distance
  const s = (dAP + dBP + dAB) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - dAP) * (s - dBP) * (s - dAB)));
  return (2 * area) / dAB;
}
